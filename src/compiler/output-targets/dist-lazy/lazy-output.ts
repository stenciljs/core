import { catchError, isOutputTargetDist, isOutputTargetDistLazy, sortBy } from '@utils';
import MagicString from 'magic-string';
import * as ts from 'typescript';

import type * as d from '../../../declarations';
import type { BundleOptions } from '../../bundle/bundle-interface';
import { bundleOutput } from '../../bundle/bundle-output';
import {
  LAZY_BROWSER_ENTRY_ID,
  LAZY_EXTERNAL_ENTRY_ID,
  STENCIL_APP_GLOBALS_ID,
  STENCIL_CORE_ID,
  STENCIL_INTERNAL_CLIENT_PATCH_BROWSER_ID,
  USER_INDEX_ENTRY_ID,
} from '../../bundle/entry-alias-ids';
import { generateComponentBundles } from '../../entries/component-bundles';
import { generateModuleGraph } from '../../entries/component-graph';
import { lazyComponentTransform } from '../../transformers/component-lazy/transform-lazy-component';
import { removeCollectionImports } from '../../transformers/remove-collection-imports';
import { rewriteAliasedSourceFileImportPaths } from '../../transformers/rewrite-aliased-paths';
import { updateStencilCoreImports } from '../../transformers/update-stencil-core-import';
import { generateCjs } from './generate-cjs';
import { generateEsm } from './generate-esm';
import { generateEsmBrowser } from './generate-esm-browser';
import { generateSystem } from './generate-system';
import { getLazyBuildConditionals } from './lazy-build-conditionals';

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
    const bundleOpts: BundleOptions = {
      id: 'lazy',
      platform: 'client',
      conditionals: getLazyBuildConditionals(config, buildCtx.components),
      customBeforeTransformers: getCustomBeforeTransformers(config, compilerCtx),
      inlineWorkers: config.outputTargets.some(isOutputTargetDist),
      inputs: {
        [config.fsNamespace]: LAZY_BROWSER_ENTRY_ID,
        loader: LAZY_EXTERNAL_ENTRY_ID,
        index: USER_INDEX_ENTRY_ID,
      },
      loader: {
        [LAZY_EXTERNAL_ENTRY_ID]: getLazyEntry(false),
        [LAZY_BROWSER_ENTRY_ID]: getLazyEntry(true),
      },
    };

    // we've got the compiler context filled with app modules and collection dependency modules
    // figure out how all these components should be connected
    generateEntryModules(config, buildCtx);
    buildCtx.entryModules.forEach((entryModule) => {
      bundleOpts.inputs[entryModule.entryKey] = entryModule.entryKey;
    });

    const rollupBuild = await bundleOutput(config, compilerCtx, buildCtx, bundleOpts);
    if (rollupBuild != null) {
      const results: d.UpdatedLazyBuildCtx[] = await Promise.all([
        generateEsmBrowser(config, compilerCtx, buildCtx, rollupBuild, outputTargets),
        generateEsm(config, compilerCtx, buildCtx, rollupBuild, outputTargets),
        generateSystem(config, compilerCtx, buildCtx, rollupBuild, outputTargets),
        generateCjs(config, compilerCtx, buildCtx, rollupBuild, outputTargets),
      ]);

      results.forEach((result) => {
        if (result.name === 'cjs') {
          buildCtx.commonJsComponentBundle = result.buildCtx.commonJsComponentBundle;
        } else if (result.name === 'system') {
          buildCtx.systemComponentBundle = result.buildCtx.systemComponentBundle;
        } else if (result.name === 'esm') {
          buildCtx.esmComponentBundle = result.buildCtx.esmComponentBundle;
          buildCtx.es5ComponentBundle = result.buildCtx.es5ComponentBundle;
        } else if (result.name === 'esm-browser') {
          buildCtx.esmBrowserComponentBundle = result.buildCtx.esmBrowserComponentBundle;
          buildCtx.buildResults = result.buildCtx.buildResults;
          buildCtx.components = result.buildCtx.components;
        }
      });

      if (buildCtx.esmBrowserComponentBundle != null) {
        buildCtx.componentGraph = generateModuleGraph(buildCtx.components, buildCtx.esmBrowserComponentBundle);
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
 #
 * @param config the Stencil configuration associated with the current build
 * @param compilerCtx the current compiler context
 * @returns a collection of transformations that should be applied to the source code, intended for the `before` part
 * of the pipeline
 */
const getCustomBeforeTransformers = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
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

  customBeforeTransformers.push(
    lazyComponentTransform(compilerCtx, transformOpts),
    removeCollectionImports(compilerCtx),
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

const getLazyEntry = (isBrowser: boolean): string => {
  const s = new MagicString(``);
  s.append(`export { setNonce } from '${STENCIL_CORE_ID}';\n`);
  s.append(`import { bootstrapLazy } from '${STENCIL_CORE_ID}';\n`);

  if (isBrowser) {
    s.append(`import { patchBrowser } from '${STENCIL_INTERNAL_CLIENT_PATCH_BROWSER_ID}';\n`);
    s.append(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';\n`);
    s.append(`patchBrowser().then(async (options) => {\n`);
    s.append(`  await globalScripts();\n`);
    s.append(`  return bootstrapLazy([/*!__STENCIL_LAZY_DATA__*/], options);\n`);
    s.append(`});\n`);
  } else {
    s.append(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';\n`);
    s.append(`export const defineCustomElements = async (win, options) => {\n`);
    s.append(`  if (typeof window === 'undefined') return undefined;\n`);
    s.append(`  await globalScripts();\n`);
    s.append(`  return bootstrapLazy([/*!__STENCIL_LAZY_DATA__*/], options);\n`);
    s.append(`};\n`);
  }

  return s.toString();
};
