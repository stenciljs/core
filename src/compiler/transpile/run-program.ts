import {
  getComponentsFromModules,
  isOutputTargetDistTypes,
  join,
  loadTypeScriptDiagnostics,
  normalizePath,
  relative,
} from '@utils';
import { basename } from 'path';
import ts from 'typescript';

import type * as d from '../../declarations';
import { updateComponentBuildConditionals } from '../app-core/app-data';
import { resolveComponentDependencies } from '../entries/resolve-component-dependencies';
import { performAutomaticKeyInsertion } from '../transformers/automatic-key-insertion';
import { convertDecoratorsToStatic } from '../transformers/decorators-to-static/convert-decorators';
import { rewriteAliasedDTSImportPaths } from '../transformers/rewrite-aliased-paths';
import { updateModule } from '../transformers/static-to-meta/parse-static';
import { generateAppTypes } from '../types/generate-app-types';
import { updateStencilTypesImports } from '../types/stencil-types';
import { validateTranspiledComponents } from './validate-components';

export const runTsProgram = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  tsBuilder: ts.BuilderProgram,
): Promise<boolean> => {
  const tsSyntactic = loadTypeScriptDiagnostics(tsBuilder.getSyntacticDiagnostics());
  const tsGlobal = loadTypeScriptDiagnostics(tsBuilder.getGlobalDiagnostics());
  const tsOptions = loadTypeScriptDiagnostics(tsBuilder.getOptionsDiagnostics());
  buildCtx.diagnostics.push(...tsSyntactic);
  buildCtx.diagnostics.push(...tsGlobal);
  buildCtx.diagnostics.push(...tsOptions);

  if (buildCtx.hasError) {
    return false;
  }

  const tsProgram = tsBuilder.getProgram();

  const tsTypeChecker = tsProgram.getTypeChecker();
  const typesOutputTarget = config.outputTargets.filter(isOutputTargetDistTypes);
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
      updateModule(config, compilerCtx, buildCtx, tsSourceFiles[0], data, emitFilePath, tsTypeChecker, null);
    } else if (emitFilePath.endsWith('.d.ts')) {
      const srcDtsPath = normalizePath(tsSourceFiles[0].fileName);
      const relativeEmitFilepath = getRelativeDts(config, srcDtsPath, emitFilePath);

      emittedDts.push(srcDtsPath);
      typesOutputTarget.forEach((o) => {
        const distPath = normalizePath(join(normalizePath(o.typesDir), normalizePath(relativeEmitFilepath)));
        data = updateStencilTypesImports(o.typesDir, distPath, data);
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
  tsBuilder.emit(undefined, emitCallback, undefined, false, transformers);

  const changedmodules = Array.from(compilerCtx.changedModules.keys());
  buildCtx.debug('Transpiled modules: ' + JSON.stringify(changedmodules, null, '\n'));

  // Finalize components metadata
  buildCtx.moduleFiles = Array.from(compilerCtx.moduleMap.values());
  buildCtx.components = getComponentsFromModules(buildCtx.moduleFiles);

  updateComponentBuildConditionals(compilerCtx.moduleMap, buildCtx.components);
  resolveComponentDependencies(buildCtx.components);

  validateTranspiledComponents(config, buildCtx);

  if (buildCtx.hasError) {
    return false;
  }

  // create the components.d.ts file and write to disk
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
            const distPath = join(o.typesDir, relativeEmitFilepath);
            let dtsContent = await compilerCtx.fs.readFile(srcRootDtsFilePath);
            dtsContent = updateStencilTypesImports(o.typesDir, distPath, dtsContent);
            await compilerCtx.fs.writeFile(distPath, dtsContent);
          }),
        );
      });

    await Promise.all(srcRootDtsFiles);
  }

  // TODO(STENCIL-540): remove `hasTypesChanged` check and figure out how to generate types before
  // executing the TS build program so we don't get semantic diagnostic errors about referencing the
  // auto-generated `components.d.ts` file.
  if (config.validateTypes && !hasTypesChanged) {
    const tsSemantic = loadTypeScriptDiagnostics(tsBuilder.getSemanticDiagnostics());
    if (config.devMode) {
      tsSemantic.forEach((semanticDiagnostic) => {
        // Unused variable errors become warnings in dev mode
        if (semanticDiagnostic.code === '6133' || semanticDiagnostic.code === '6192') {
          semanticDiagnostic.level = 'warn';
        }
      });
    }
    buildCtx.diagnostics.push(...tsSemantic);
  }

  return hasTypesChanged;
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
export const getRelativeDts = (config: d.ValidatedConfig, srcPath: string, emitDtsPath: string): string => {
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
