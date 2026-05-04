import MagicString from 'magic-string';
import * as ts from 'typescript';
import type * as d from '@stencil/core';

import {
  catchError,
  isOutputTargetAssets,
  isOutputTargetLoaderBundle,
  isOutputTargetDistLazy,
  relative,
  sortBy,
} from '../../../utils';
import { bundleOutput } from '../../bundle/bundle-output';
import {
  LAZY_BROWSER_ENTRY_ID,
  LAZY_EXTERNAL_ENTRY_ID,
  STENCIL_APP_GLOBALS_ID,
  STENCIL_CORE_ID,
  USER_INDEX_ENTRY_ID,
} from '../../bundle/entry-alias-ids';
import { generateComponentBundles } from '../../entries/component-bundles';
import { generateModuleGraph } from '../../entries/component-graph';
import { addTagTransform } from '../../transformers/add-tag-transform';
import { lazyComponentTransform } from '../../transformers/component-lazy/transform-lazy-component';
import { removeRebundleImports } from '../../transformers/remove-rebundle-imports';
import { rewriteAliasedSourceFileImportPaths } from '../../transformers/rewrite-aliased-paths';
import { updateStencilCoreImports } from '../../transformers/update-stencil-core-import';
import { generateCjs } from './generate-cjs';
import { generateEsm } from './generate-esm';
import { generateEsmBrowser } from './generate-esm-browser';
import { generateLoader } from './generate-loader';
import { getLazyBuildConditionals } from './lazy-build-conditionals';
import type { BundleOptions } from '../../bundle/bundle-interface';

export const outputLazy = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const outputTargets = config.outputTargets.filter(isOutputTargetDistLazy);
  if (outputTargets.length === 0) {
    return;
  }

  const bundleEventMessage = `generate lazy${config.sourceMap ? ' + source maps' : ''}`;
  const timespan = buildCtx.createTimeSpan(`${bundleEventMessage} started`);

  try {
    const assetsTarget = config.outputTargets.find(isOutputTargetAssets);
    const hasAssets = buildCtx.components.some(
      (cmp) => cmp.assetsDirs != null && cmp.assetsDirs.length > 0,
    );

    const computeAssetPath = (fromDir: string | undefined): string | undefined => {
      if (!hasAssets || !fromDir || !assetsTarget?.dir) return undefined;
      const rel = relative(fromDir, assetsTarget.dir);
      return rel.endsWith('/') ? rel : rel + '/';
    };

    const browserTarget = outputTargets.find((o) => o.isBrowserBuild && o.esmDir);
    const externalTarget = outputTargets.find((o) => !o.isBrowserBuild && o.esmDir);

    const bundleOpts: BundleOptions = {
      id: 'lazy',
      platform: 'client',
      conditionals: getLazyBuildConditionals(config, buildCtx.components),
      customBeforeTransformers: getCustomBeforeTransformers(config, compilerCtx, buildCtx),
      inlineWorkers: config.outputTargets.some(isOutputTargetLoaderBundle),
      inputs: {
        [config.fsNamespace]: LAZY_BROWSER_ENTRY_ID,
        loader: LAZY_EXTERNAL_ENTRY_ID,
        index: USER_INDEX_ENTRY_ID,
      },
      loader: {
        [LAZY_EXTERNAL_ENTRY_ID]: getLazyEntry(false, computeAssetPath(externalTarget?.esmDir)),
        [LAZY_BROWSER_ENTRY_ID]: getLazyEntry(true, computeAssetPath(browserTarget?.esmDir)),
      },
    };

    // we've got the compiler context filled with app modules and collection dependency modules
    // figure out how all these components should be connected
    const entryGenStart = performance.now();
    generateEntryModules(config, buildCtx);
    buildCtx.entryModules.forEach((entryModule) => {
      bundleOpts.inputs[entryModule.entryKey] = entryModule.entryKey;
    });
    buildCtx.debug(
      `lazy: generateEntryModules: ${(performance.now() - entryGenStart).toFixed(1)}ms`,
    );

    const rolldownBuild = await bundleOutput(config, compilerCtx, buildCtx, bundleOpts);
    if (rolldownBuild != null) {
      const results: d.UpdatedLazyBuildCtx[] = await Promise.all([
        generateEsmBrowser(config, compilerCtx, buildCtx, rolldownBuild, outputTargets),
        generateEsm(config, compilerCtx, buildCtx, rolldownBuild, outputTargets),
        generateCjs(config, compilerCtx, buildCtx, rolldownBuild, outputTargets),
      ]);

      results.forEach((result) => {
        if (result.name === 'cjs') {
          buildCtx.commonJsComponentBundle = result.buildCtx.commonJsComponentBundle;
        } else if (result.name === 'esm') {
          buildCtx.esmComponentBundle = result.buildCtx.esmComponentBundle;
        } else if (result.name === 'esm-browser') {
          buildCtx.esmBrowserComponentBundle = result.buildCtx.esmBrowserComponentBundle;
          buildCtx.buildResults = result.buildCtx.buildResults;
          buildCtx.components = result.buildCtx.components;
        }
      });

      // Generate loader directory with forwarding files
      await generateLoader(compilerCtx, outputTargets);

      if (buildCtx.esmBrowserComponentBundle != null) {
        buildCtx.componentGraph = generateModuleGraph(
          buildCtx.components,
          buildCtx.esmBrowserComponentBundle,
        );
      }
    }
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }

  timespan.finish(`${bundleEventMessage} finished`);
};

/**
 * Generate a collection of transformations that are to be applied as a part of the `before` step in the TypeScript
 * compilation process.
 *
 * @param config the Stencil configuration associated with the current build
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @returns a collection of transformations that should be applied to the source code, intended for the `before` part
 * of the pipeline
 */
const getCustomBeforeTransformers = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx?: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile>[] => {
  const transformOpts: d.TransformOptions = {
    coreImportPath: STENCIL_CORE_ID,
    componentExport: 'lazy',
    componentMetadata: null,
    currentDirectory: config.sys.getCurrentDirectory(),
    proxy: null,
    style: 'static',
    styleImportData: 'queryparams',
  };
  const customBeforeTransformers = [updateStencilCoreImports(transformOpts.coreImportPath)];

  if (config.transformAliasedImportPaths) {
    customBeforeTransformers.push(rewriteAliasedSourceFileImportPaths);
  }

  if (buildCtx.config.extras.additionalTagTransformers) {
    customBeforeTransformers.push(addTagTransform(compilerCtx, buildCtx));
  }

  customBeforeTransformers.push(
    lazyComponentTransform(compilerCtx, transformOpts, buildCtx),
    removeRebundleImports(compilerCtx),
  );
  return customBeforeTransformers;
};

/**
 * Generate entry modules to be used by the build process by determining how
 * modules and components are connected
 *
 * **Note**: this function mutates the {@link d.BuildCtx} object that is
 * passed in to it, assigning the generated entry modules to the `entryModules`
 * property
 *
 * @param config the Stencil configuration file that was provided as a part of the build step
 * @param buildCtx the current build context
 */
function generateEntryModules(config: d.ValidatedConfig, buildCtx: d.BuildCtx): void {
  // figure out how modules and components connect
  try {
    const bundles = generateComponentBundles(config, buildCtx);
    buildCtx.entryModules = bundles.map(createEntryModule);
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }

  buildCtx.debug(`generateEntryModules, ${buildCtx.entryModules.length} entryModules`);
}

/**
 * Generates an entry module to be used during the bundling process
 * @param cmps the component metadata to create a single entry module from
 * @returns the entry module generated
 */
function createEntryModule(cmps: d.ComponentCompilerMeta[]): d.EntryModule {
  // generate a unique entry key based on the components within this entry module
  cmps = sortBy(cmps, (c) => c.tagName);
  const entryKey = cmps.map((c) => c.tagName).join('.') + '.entry';

  return {
    cmps,
    entryKey,
  };
}

const getLazyEntry = (isBrowser: boolean, assetPath?: string): string => {
  const s = new MagicString(``);
  s.append(`export { setNonce } from '${STENCIL_CORE_ID}';\n`);
  s.append(`import { bootstrapLazy } from '${STENCIL_CORE_ID}';\n`);

  if (isBrowser) {
    if (assetPath) {
      s.append(`import { setAssetPath } from '${STENCIL_CORE_ID}';\n`);
    }
    s.append(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';\n`);
    s.append(`(async () => {\n`);
    if (assetPath) {
      s.append(`  const __assetBase = new URL('${assetPath}', String(import.meta.url)).href;\n`);
      s.append(`  setAssetPath(__assetBase);\n`);
    }
    s.append(`  await globalScripts();\n`);
    s.append(`  bootstrapLazy(["__STENCIL_LAZY_DATA__"]);\n`);
    s.append(`})();\n`);
  } else {
    if (assetPath) {
      s.append(`import { setAssetPath } from '${STENCIL_CORE_ID}';\n`);
    }
    s.append(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';\n`);
    if (assetPath) {
      s.append(`const __assetBase = new URL('${assetPath}', String(import.meta.url)).href;\n`);
      s.append(`setAssetPath(__assetBase);\n`);
    }
    s.append(`export const defineCustomElements = async (win, options) => {\n`);
    s.append(`  if (typeof window === 'undefined') return undefined;\n`);
    s.append(`  await globalScripts();\n`);
    s.append(`  return bootstrapLazy(["__STENCIL_LAZY_DATA__"], options);\n`);
    s.append(`};\n`);
  }

  return s.toString();
};
