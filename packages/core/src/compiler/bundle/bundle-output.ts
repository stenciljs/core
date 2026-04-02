import { rolldown, InputOptions, TreeshakingOptions, Plugin } from 'rolldown';
import type * as d from '@stencil/core';

import { createOnWarnFn, loadRollupDiagnostics } from '../../utils';
import { lazyComponentPlugin } from '../output-targets/dist-lazy/lazy-component-plugin';
import { appDataPlugin } from './app-data-plugin';
import { coreResolvePlugin } from './core-resolve-plugin';
import { devNodeModuleResolveId } from './dev-node-module-resolve';
import { extFormatPlugin } from './ext-format-plugin';
import { extTransformsPlugin } from './ext-transforms-plugin';
import { fileLoadPlugin } from './file-load-plugin';
import { loaderPlugin } from './loader-plugin';
import { pluginHelper } from './plugin-helper';
import { serverPlugin } from './server-plugin';
import { typescriptPlugin } from './typescript-plugin';
import { userIndexPlugin } from './user-index-plugin';
import { workerPlugin } from './worker-plugin';
import type { BundleOptions } from './bundle-interface';

export const bundleOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  bundleOpts: BundleOptions,
) => {
  try {
    const rollupOptions = getRollupOptions(config, compilerCtx, buildCtx, bundleOpts);
    const rollupBuild = await rolldown(rollupOptions);

    // Note: Rolldown doesn't support caching the same way Rollup does
    // compilerCtx.rollupCache.set(bundleOpts.id, rollupBuild.cache);
    return rollupBuild;
  } catch (e: any) {
    if (!buildCtx.hasError) {
      // TODO(STENCIL-353): Implement a type guard that balances using our own copy of Rollup types (which are
      // breakable) and type safety (so that the error variable may be something other than `any`)
      loadRollupDiagnostics(config, compilerCtx, buildCtx, e);
    }
  }
  return undefined;
};

/**
 * Build the rollup options that will be used to transpile, minify, and otherwise transform a Stencil project
 * @param config the Stencil configuration for the project
 * @param compilerCtx the current compiler context
 * @param buildCtx a context object containing information about the current build
 * @param bundleOpts Rollup bundling options to apply to the base configuration setup by this function
 * @returns the rollup options to be used
 */
export const getRollupOptions = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  bundleOpts: BundleOptions,
): InputOptions => {
  const beforePlugins = config.rollupPlugins.before || [];
  const afterPlugins = config.rollupPlugins.after || [];

  // Create a plugin for dev module resolution if enabled
  const devModulePlugin: Plugin | null = config.devServer?.experimentalDevModules
    ? {
        name: 'stencil-dev-module-resolve',
        async resolveId(importee: string, importer: string | undefined) {
          // Let other plugins handle it first, then intercept the result
          const resolved = await this.resolve(importee, importer, { skipSelf: true });
          if (resolved) {
            return devNodeModuleResolveId(config, compilerCtx.fs, resolved, importee);
          }
          return null;
        },
      }
    : null;

  const rollupOptions: InputOptions = {
    input: bundleOpts.inputs,
    platform: bundleOpts.platform === 'hydrate' ? 'node' : 'browser',
    tsconfig: config.tsconfig,

    plugins: [
      coreResolvePlugin(
        config,
        compilerCtx,
        bundleOpts.platform,
        !!bundleOpts.externalRuntime,
        bundleOpts.conditionals?.lazyLoad ?? false,
      ),
      appDataPlugin(config, compilerCtx, buildCtx, bundleOpts.conditionals, bundleOpts.platform),
      lazyComponentPlugin(buildCtx),
      loaderPlugin(bundleOpts.loader),
      userIndexPlugin(config, compilerCtx),
      typescriptPlugin(compilerCtx, bundleOpts, config),
      extFormatPlugin(config),
      extTransformsPlugin(config, compilerCtx, buildCtx),
      workerPlugin(config, compilerCtx, buildCtx, bundleOpts.platform, !!bundleOpts.inlineWorkers),
      serverPlugin(config, bundleOpts.platform),
      ...beforePlugins,
      devModulePlugin,
      ...afterPlugins,
      pluginHelper(config, buildCtx, bundleOpts.platform),
      fileLoadPlugin(compilerCtx.fs),
    ].filter(Boolean) as Plugin[],

    resolve: {
      // Stencil-specific main fields plus standard ones
      mainFields: ['collection:main', 'jsnext:main', 'es2017', 'es2015', 'module', 'main'] as any,
      // Export conditions for package.json exports field
      conditionNames: (bundleOpts.platform === 'hydrate'
        ? ['node', 'import', 'require', 'default']
        : ['browser', 'default', 'import', 'module', 'require']) as string[],
      // File extensions to resolve (includes .d.ts for type declaration files)
      extensions: [
        '.tsx',
        '.ts',
        '.mts',
        '.cts',
        '.js',
        '.mjs',
        '.cjs',
        '.json',
        '.d.ts',
        '.d.mts',
        '.d.cts',
      ] as any,
      // Apply user's nodeResolve config if provided
      ...config.nodeResolve,
    },

    // Use Rolldown's transform.define for process.env.NODE_ENV replacement
    // Replaces @rollup/plugin-replace
    transform: {
      define: {
        'process.env.NODE_ENV': config.devMode ? '"development"' : '"production"',
      },
    },

    // Disable warnings about built-in features we're intentionally using
    checks: {
      preferBuiltinFeature: false,
    },

    // Tell Rolldown to treat these files as JS - our plugins transform them to ESM
    // CSS: ext-transforms-plugin handles CSS to ESM conversion
    // Text/assets: ext-format-plugin handles text/url to ESM conversion
    moduleTypes: {
      '.css': 'js',
      '.scss': 'js',
      '.sass': 'js',
      '.less': 'js',
      '.styl': 'js',
      '.stylus': 'js',
      '.pcss': 'js',
      // Text formats (from ext-format-plugin FORMAT_TEXT_EXTS)
      '.txt': 'js',
      '.frag': 'js',
      '.vert': 'js',
      // URL formats (from ext-format-plugin FORMAT_URL_MIME)
      '.svg': 'js',
    },

    treeshake: getTreeshakeOption(config, bundleOpts),
    preserveEntrySignatures: bundleOpts.preserveEntrySignatures ?? 'strict',

    onwarn: createOnWarnFn(buildCtx.diagnostics),

    // Note: Rolldown doesn't support the cache option like Rollup does
    // cache: compilerCtx.rollupCache.get(bundleOpts.id),

    external: config.rollupConfig.inputOptions.external,

    // Note: maxParallelFileOps is not supported in Rolldown
    // maxParallelFileOps: config.rollupConfig.inputOptions.maxParallelFileOps,
  };

  return rollupOptions;
};

const getTreeshakeOption = (
  config: d.ValidatedConfig,
  bundleOpts: BundleOptions,
): TreeshakingOptions | boolean => {
  // Note: Rolldown's TreeshakingOptions only supports moduleSideEffects,
  // not propertyReadSideEffects or tryCatchDeoptimization like Rollup
  if (bundleOpts.platform === 'hydrate') {
    return true;
  }

  return !config.devMode && config.rollupConfig.inputOptions.treeshake !== false;
};
