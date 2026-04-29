import { basename } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import {
  filterExcludedComponents,
  getComponentsFromModules,
  isOutputTargetTypes,
  join,
  loadTypeScriptDiagnostics,
  normalizePath,
  relative,
} from '../../utils';
import { updateComponentBuildConditionals } from '../app-core/app-data';
import { resolveComponentDependencies } from '../entries/resolve-component-dependencies';
import { performAutomaticKeyInsertion } from '../transformers/automatic-key-insertion';
import { convertDecoratorsToStatic } from '../transformers/decorators-to-static/convert-decorators';
import { rewriteAliasedDTSImportPaths } from '../transformers/rewrite-aliased-paths';
import { updateModule } from '../transformers/static-to-meta/parse-static';
import { generateAppTypes } from '../types/generate-app-types';
import { updateStencilTypesImports } from '../types/stencil-types';
import { validateTranspiledComponents } from './validate-components';

/**
 * Run the TypeScript program to transpile source files.
 *
 * @param config - the validated Stencil configuration
 * @param compilerCtx - the current compiler context
 * @param buildCtx - the current build context
 * @param tsBuilder - the TypeScript builder program
 * @returns an array of emitted .d.ts file paths
 */
export const runTsProgram = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  tsBuilder: ts.BuilderProgram,
): Promise<string[]> => {
  const tsSyntactic = loadTypeScriptDiagnostics(tsBuilder.getSyntacticDiagnostics());
  const tsGlobal = loadTypeScriptDiagnostics(tsBuilder.getGlobalDiagnostics());
  const tsOptions = loadTypeScriptDiagnostics(tsBuilder.getOptionsDiagnostics());
  buildCtx.diagnostics.push(...tsSyntactic);
  buildCtx.diagnostics.push(...tsGlobal);
  buildCtx.diagnostics.push(...tsOptions);

  if (buildCtx.hasError) {
    return [];
  }

  const tsProgram = tsBuilder.getProgram();

  const tsTypeChecker = tsProgram.getTypeChecker();
  const typesOutputTarget = config.outputTargets.filter(isOutputTargetTypes);
  const emittedDts: string[] = [];

  const emitCallback: ts.WriteFileCallback = (emitFilePath, data, _w, _e, tsSourceFiles) => {
    if (
      emitFilePath.includes('e2e.') ||
      emitFilePath.includes('spec.') ||
      emitFilePath.endsWith('e2e.d.ts') ||
      emitFilePath.endsWith('spec.d.ts')
    ) {
      // we don't want to write these to disk!
      return;
    }

    if (emitFilePath.endsWith('.js') || emitFilePath.endsWith('js.map')) {
      updateModule(
        config,
        compilerCtx,
        buildCtx,
        tsSourceFiles[0],
        data,
        emitFilePath,
        tsTypeChecker,
        null,
      );
    } else if (emitFilePath.endsWith('.d.ts')) {
      const srcDtsPath = normalizePath(tsSourceFiles[0].fileName);
      const relativeEmitFilepath = getRelativeDts(config, srcDtsPath, emitFilePath);

      emittedDts.push(srcDtsPath);
      typesOutputTarget.forEach((o) => {
        const distPath = normalizePath(
          join(normalizePath(o.dir!), normalizePath(relativeEmitFilepath)),
        );
        data = updateStencilTypesImports(o.dir!, distPath, data);
        compilerCtx.fs.writeFile(distPath, data);
      });
    }
  };

  const transformers: ts.CustomTransformers = {
    before: [
      convertDecoratorsToStatic(config, buildCtx.diagnostics, tsTypeChecker, tsProgram),
      performAutomaticKeyInsertion,
    ],
    afterDeclarations: [],
  };

  if (config.transformAliasedImportPaths) {
    /**
     * Generate a collection of transformations that are to be applied as a part of the `afterDeclarations` step in the
     * TypeScript compilation process.
     *
     * TypeScript handles the generation of JS and `.d.ts` files through different pipelines. One (possibly surprising)
     * consequence of this is that if you modify a source file using a transformer, it will not automatically result in
     * changes to the corresponding `.d.ts` file. Instead, if you want to, for instance, rewrite some import specifiers
     * in both the source file _and_ its typedef you'll need to run a transformer for both of them.
     *
     * See here: https://github.com/itsdouges/typescript-transformer-handbook#transforms
     * and here: https://github.com/microsoft/TypeScript/pull/23946
     *
     * This quirk is not terribly well documented, unfortunately.
     */
    transformers.afterDeclarations.push(rewriteAliasedDTSImportPaths);
  }

  // Emit files that changed
  const emitResult = tsBuilder.emit(undefined, emitCallback, undefined, false, transformers);

  // Check for emit diagnostics
  if (emitResult.diagnostics.length > 0) {
    const emitDiagnostics = loadTypeScriptDiagnostics(emitResult.diagnostics);

    // Enhance error messages for TS4094 to be more helpful for mixin users;
    // These occur when mixins return classes with private/protected members that TypeScript cannot emit
    emitDiagnostics.forEach((diagnostic) => {
      if (diagnostic.code === '4094') {
        diagnostic.level = 'warn';
        diagnostic.messageText =
          `${diagnostic.messageText}\n\n` +
          `This commonly occurs when using mixins that return classes with private or protected members. ` +
          `TypeScript cannot emit declaration files for anonymous classes with non-public members.\n\n` +
          `Possible solutions:\n` +
          `  1. Add explicit type annotations to your mixin's return type\n` +
          `  2. Use public members in your mixin classes`;
      }
    });

    buildCtx.diagnostics.push(...emitDiagnostics);
  }

  const changedmodules = Array.from(compilerCtx.changedModules.keys());
  buildCtx.debug('Transpiled modules: ' + JSON.stringify(changedmodules, null, '\n'));

  // Finalize components metadata
  buildCtx.moduleFiles = Array.from(compilerCtx.moduleMap.values());
  const allComponents = getComponentsFromModules(buildCtx.moduleFiles);

  // Filter out excluded components based on config patterns
  const { components: filteredComponents, excludedComponents } = filterExcludedComponents(
    allComponents,
    config,
  );
  buildCtx.components = filteredComponents;

  // Queue deletion of .d.ts files for excluded components in the in-memory FS
  // These deletions will be committed when compilerCtx.fs.commit() is called during writeBuild
  if (excludedComponents.length > 0 && typesOutputTarget.length > 0) {
    excludedComponents.forEach((cmp) => {
      const srcPath = normalizePath(cmp.sourceFilePath);
      const relativeToSrc = relative(config.srcDir, srcPath);
      const dtsRelativePath = relativeToSrc.replace(/\.tsx?$/, '.d.ts');

      typesOutputTarget.forEach((outputTarget) => {
        const outputDtsPath = join(outputTarget.dir!, dtsRelativePath);

        // The file may have been queued for writing during emit
        // We need to cancel the write and queue it for deletion instead
        const item = compilerCtx.fs.getItem(outputDtsPath);
        item.queueWriteToDisk = false;
        item.queueDeleteFromDisk = true;
      });
    });
  }

  updateComponentBuildConditionals(compilerCtx.moduleMap, buildCtx.components);
  resolveComponentDependencies(buildCtx.components);

  validateTranspiledComponents(config, buildCtx);

  if (buildCtx.hasError) {
    return [];
  }

  return emittedDts;
};

interface ValidateTypesResult {
  hasTypesChanged: boolean;
  needsRebuild: boolean;
}

/**
 * Generate types and run semantic validation AFTER components.d.ts exists on disk
 *
 * @param config - the validated Stencil configuration
 * @param compilerCtx - the current compiler context
 * @param buildCtx - the current build context
 * @param tsBuilder - the TypeScript builder program
 * @param emittedDts - array of emitted .d.ts file paths
 * @returns validation result indicating if types changed and if rebuild is needed
 */
export const validateTypesAfterGeneration = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  tsBuilder: ts.BuilderProgram,
  emittedDts: string[],
): Promise<ValidateTypesResult> => {
  const tsProgram = tsBuilder.getProgram();
  const typesOutputTarget = config.outputTargets.filter(isOutputTargetTypes);

  const componentsDtsPath = join(config.srcDir, 'components.d.ts');
  const componentsDtsExistedBefore = await compilerCtx.fs.access(componentsDtsPath);

  // First run: components.d.ts doesn't exist yet — generate it and request a fresh TS program.
  if (!componentsDtsExistedBefore) {
    await generateAppTypes(config, compilerCtx, buildCtx, 'src');
    return { hasTypesChanged: true, needsRebuild: true };
  }

  if (config.validateTypes) {
    const applyDevModeRelaxation = (diags: d.Diagnostic[]) => {
      if (config.devMode) {
        diags.forEach((d) => {
          if (d.code === '6133' || d.code === '6192') d.level = 'warn';
        });
      }
    };

    if (buildCtx.isRebuild) {
      // Incremental: only walks changed files + transitive dependents — O(changed) not O(all).
      const emitBuilder = tsBuilder as ts.EmitAndSemanticDiagnosticsBuilderProgram;
      let affected = emitBuilder.getSemanticDiagnosticsOfNextAffectedFile?.();
      while (affected) {
        if ('fileName' in affected.affected) {
          const fileName = normalizePath(affected.affected.fileName);
          if (
            !fileName.includes('node_modules') &&
            !fileName.endsWith('.d.ts') &&
            fileName.startsWith(normalizePath(config.srcDir))
          ) {
            const tsSemantic = loadTypeScriptDiagnostics(affected.result);
            applyDevModeRelaxation(tsSemantic);
            buildCtx.diagnostics.push(...tsSemantic);
          }
        }
        affected = emitBuilder.getSemanticDiagnosticsOfNextAffectedFile?.();
      }
    } else {
      // Initial build: walk all source files.
      const sourceFiles = tsProgram.getSourceFiles().filter((sf) => {
        const fileName = normalizePath(sf.fileName);
        return (
          !fileName.includes('node_modules') &&
          !fileName.endsWith('.d.ts') &&
          fileName.startsWith(normalizePath(config.srcDir))
        );
      });
      for (const sourceFile of sourceFiles) {
        const tsSemantic = loadTypeScriptDiagnostics(tsProgram.getSemanticDiagnostics(sourceFile));
        applyDevModeRelaxation(tsSemantic);
        buildCtx.diagnostics.push(...tsSemantic);
      }
    }
  }

  // Update components.d.ts in case components changed
  const hasTypesChanged = await generateAppTypes(config, compilerCtx, buildCtx, 'src');
  if (typesOutputTarget.length > 0) {
    // copy src dts files that do not get emitted by the compiler
    // but we still want to ship them in the dist directory
    const srcRootDtsFiles = tsProgram
      .getRootFileNames()
      .filter((f) => f.endsWith('.d.ts') && !f.endsWith('components.d.ts'))
      .map((s) => normalizePath(s))
      .filter((f) => !emittedDts.includes(f))
      .map((srcRootDtsFilePath) => {
        const relativeEmitFilepath = relative(config.srcDir, srcRootDtsFilePath);
        return Promise.all(
          typesOutputTarget.map(async (o) => {
            const distPath = join(o.dir!, relativeEmitFilepath);
            let dtsContent = await compilerCtx.fs.readFile(srcRootDtsFilePath);
            dtsContent = updateStencilTypesImports(o.dir!, distPath, dtsContent);
            await compilerCtx.fs.writeFile(distPath, dtsContent);
          }),
        );
      });

    await Promise.all(srcRootDtsFiles);
  }

  return { hasTypesChanged, needsRebuild: false };
};

/**
 * Calculate a relative path for a `.d.ts` file, giving the location within
 * the typedef output directory where we'd like to write it to disk.
 *
 * The correct relative path for a `.d.ts` file is basically given by the
 * relative location of the _source_ file associated with the `.d.ts` file
 * within the Stencil project's source directory.
 *
 * Thus, in order to calculate this, we take the path to the source file, the
 * emit path calculated by typescript (which is going to be right next to the
 * emit location for the JavaScript that the compiler emits for the source file)
 * and we do a pairwise walk up the two paths, assembling path components as
 * we go, until the source file path is equal to the configured source
 * directory. Then the path components from the `emitDtsPath` can be reversed
 * and re-assembled into a suitable relative path.
 *
 * @param config a Stencil configuration object
 * @param srcPath the path to the source file for the `.d.ts` file of interest
 * @param emitDtsPath the emit path for the `.d.ts` file calculated by
 * TypeScript
 * @returns a relative path to a suitable location where the typedef file can be
 * written
 */
export const getRelativeDts = (
  config: d.ValidatedConfig,
  srcPath: string,
  emitDtsPath: string,
): string => {
  const parts: string[] = [];
  for (let i = 0; i < 30; i++) {
    if (normalizePath(config.srcDir) === srcPath) {
      break;
    }
    const b = basename(emitDtsPath);
    parts.push(b);

    emitDtsPath = normalizePath(join(emitDtsPath, '..'));
    srcPath = normalizePath(join(normalizePath(srcPath), '..'));
  }
  return normalizePath(join(...parts.reverse()));
};
