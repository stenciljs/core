import type {
  CompilerCtx,
  OptimizeJsResult,
  SourceMap,
  SourceTarget,
  ValidatedConfig,
} from '@stencil/core';
import type { MinifyOptions as OxcMinifyOptions } from 'rolldown/utils';
import type {
  CompressOptions,
  MangleOptions,
  ManglePropertiesOptions,
  MinifyOptions,
} from 'terser';

import { getToolVersion } from '../../version';
import { minifyJsOxc } from './minify-js-oxc';
import { minifyJs } from './minify-js-terser';

interface OptimizeModuleOptions {
  input: string;
  sourceMap?: SourceMap;
  sourceTarget?: SourceTarget;
  isCore?: boolean;
  minify?: boolean;
  inlineHelpers?: boolean;
  modeName?: string;
}

/**
 * Begins the process of minifying a user's JavaScript
 * @param config the Stencil configuration file that was provided as a part of the build step
 * @param compilerCtx the current compiler context
 * @param opts minification options that specify how the JavaScript ought to be minified
 * @returns the minified JavaScript result
 */
export const optimizeModule = async (
  config: ValidatedConfig,
  compilerCtx: CompilerCtx,
  opts: OptimizeModuleOptions,
): Promise<OptimizeJsResult> => {
  if (!opts.minify || opts.input === '') {
    return {
      output: opts.input,
      diagnostics: [],
      sourceMap: opts.sourceMap,
    };
  }

  const isDebug = config.logLevel === 'debug';
  const jsMinifier = config.jsMinifier;
  const cacheKey = await compilerCtx.cache.createKey(
    'optimizeModule',
    jsMinifier,
    getToolVersion(jsMinifier === 'oxc' ? 'rolldown' : 'terser'),
    opts,
    isDebug,
  );
  const cachedContent = await compilerCtx.cache.get(cacheKey);
  if (cachedContent != null) {
    const cachedMap = await compilerCtx.cache.get(cacheKey + 'Map');
    return {
      output: cachedContent,
      diagnostics: [],
      sourceMap: cachedMap ? JSON.parse(cachedMap) : null,
    };
  }

  const code = opts.input;
  const results =
    jsMinifier === 'oxc'
      ? // oxc's `minifySync` is a direct, synchronous native call - no worker dispatch needed
        await minifyJsOxc(code, getOxcMinifyOptions(config, opts, isDebug))
      : await compilerCtx.worker.prepareModule(code, getTerserMinifyOptions(config, opts, isDebug));

  if (
    results != null &&
    typeof results.output === 'string' &&
    results.diagnostics.length === 0 &&
    compilerCtx != null
  ) {
    if (opts.isCore) {
      results.output = results.output.replace(/disconnectedCallback\(\)\{\},/g, '');
    }
    await compilerCtx.cache.put(cacheKey, results.output);
    if (results.sourceMap) {
      await compilerCtx.cache.put(cacheKey + 'Map', JSON.stringify(results.sourceMap));
    }
  }

  return results;
};

/**
 * Builds the terser options for a specific module being optimized, layering the module's
 * `isCore`/source map needs on top of the baseline options from {@link getTerserOptions}.
 *
 * @param config the Stencil configuration file that was provided as a part of the build step
 * @param opts the options for the module being optimized
 * @param isDebug if true, set the necessary flags to produce readable, debuggable output
 * @returns the minification options to hand to terser
 */
const getTerserMinifyOptions = (
  config: ValidatedConfig,
  opts: OptimizeModuleOptions,
  isDebug: boolean,
): MinifyOptions => {
  const minifyOpts = getTerserOptions(config, opts.sourceTarget, isDebug);

  if (config.sourceMap) {
    minifyOpts.sourceMap = {
      content:
        // We need to loosely check for a source map definition
        // so we don't spread a `null`/`undefined` value into the object
        // which results in invalid source maps during minification
        opts.sourceMap != null
          ? {
              ...opts.sourceMap,
              version: 3,
            }
          : undefined,
    };
  }

  const compressOpts = minifyOpts.compress as CompressOptions;
  const mangleOptions = minifyOpts.mangle as MangleOptions;

  if (opts.isCore) {
    if (!isDebug) {
      compressOpts.passes = 2;
      compressOpts.global_defs = {
        supportsListenerOptions: true,
      };
      compressOpts.pure_funcs = compressOpts.pure_funcs || [];
      compressOpts.pure_funcs = ['getHostRef', ...compressOpts.pure_funcs];
    }

    mangleOptions.properties = {
      debug: isDebug,
      ...getTerserManglePropertiesConfig(),
    };

    compressOpts.inline = 1;
    compressOpts.unsafe = true;
    compressOpts.unsafe_undefined = true;
  }

  return minifyOpts;
};

/**
 * Builds a configuration object to be used by Terser for the purposes of minifying a user's JavaScript
 * @param config the Stencil configuration file that was provided as a part of the build step
 * @param sourceTarget the version of JavaScript being targeted (e.g. ES2017)
 * @param prettyOutput if true, set the necessary flags to beautify the output of terser
 * @returns the minification options
 */
export const getTerserOptions = (
  config: ValidatedConfig,
  sourceTarget: SourceTarget | undefined,
  prettyOutput: boolean,
): MinifyOptions => {
  const opts: MinifyOptions = {
    ie8: false,
    safari10: false,
    format: {},
    sourceMap: config.sourceMap,
  };

  opts.mangle = {
    properties: getTerserManglePropertiesConfig(),
  };
  opts.compress = {
    pure_getters: true,
    keep_fargs: false,
    passes: 2,
  };

  opts.ecma = opts.format.ecma = opts.compress.ecma = 2018;
  opts.toplevel = true;
  opts.module = true;
  opts.mangle.toplevel = true;
  opts.compress.arrows = true;
  opts.compress.module = true;
  opts.compress.toplevel = true;

  if (prettyOutput) {
    opts.mangle = {
      keep_fnames: true,
      properties: getTerserManglePropertiesConfig(),
    };
    opts.compress = {};
    opts.compress.drop_console = false;
    opts.compress.drop_debugger = false;
    opts.compress.pure_funcs = [];
    opts.format.beautify = true;
    opts.format.indent_level = 2;
    opts.format.comments = 'all';
  }

  return opts;
};

/**
 * Get baseline configuration for the 'properties' option for terser's mangle
 * configuration.
 *
 * @returns an object with our baseline property mangling configuration
 */
function getTerserManglePropertiesConfig(): ManglePropertiesOptions {
  const options = {
    regex: '^\\$.+\\$$',
    // we need to reserve this name so that it can be accessed on `hostRef`
    // at runtime
    reserved: ['$hostElement$'],
  } satisfies ManglePropertiesOptions;

  return options;
}

/**
 * Builds the oxc (rolldown minifier) options for a specific module being optimized.
 *
 * A few terser knobs have no oxc equivalent and so are dropped:
 * - `global_defs` (used to fold `supportsListenerOptions` to `true` in the core runtime bundle)
 * - `unsafe`/`unsafe_undefined`/`inline` compress passes
 * - `passes` (oxc's compressor iterates to a fix point automatically)
 *
 * @param config the Stencil configuration file that was provided as a part of the build step
 * @param opts the options for the module being optimized
 * @param isDebug if true, set the necessary flags to produce readable, debuggable output
 * @returns the minification options to hand to oxc
 */
export const getOxcMinifyOptions = (
  config: ValidatedConfig,
  opts: OptimizeModuleOptions,
  isDebug: boolean,
): OxcMinifyOptions => {
  const minifyOpts: OxcMinifyOptions = {
    module: true,
    sourcemap: !!config.sourceMap,
    inputMap: config.sourceMap ? (opts.sourceMap ?? undefined) : undefined,
    mangleProps: getOxcManglePropertiesConfig(isDebug),
  };

  if (isDebug) {
    minifyOpts.mangle = false;
    minifyOpts.compress = {
      dropConsole: false,
      dropDebugger: false,
    };
    minifyOpts.codegen = {
      removeWhitespace: false,
      legalComments: 'inline',
    };
  } else {
    minifyOpts.mangle = { toplevel: true };
    minifyOpts.compress = {
      treeshake: {
        propertyReadSideEffects: false,
        manualPureFunctions: opts.isCore ? ['getHostRef'] : [],
      },
    };
  }

  return minifyOpts;
};

/**
 * `ComponentRuntimeMeta` (the shape of a component class's static `cmpMeta` getter) is
 * produced by one compiled unit and read by another (e.g. a component's own chunk vs the
 * SSR/hydrate runtime, or a lazy component's entry chunk vs the core runtime chunk).
 *
 * Oxc's mangleProps` has been observed to mangle a property at its read site but leave the same
 * property's key unmangled silently breaking that read (e.g. `cmpMeta.$tagName$` reads as `undefined`).
 * Reserving these names avoids the mismatch entirely.
 *
 * Assess in time with rolldown / oxc updates via `cd test/build/output && pnpm test`
 */
const RESERVED_CMP_META_PROPS = [
  '$flags$',
  '$tagName$',
  '$members$',
  '$listeners$',
  '$attrsToReflect$',
  '$watchers$',
  '$lazyBundleId$',
  '$serializers$',
  '$deserializers$',
];

/**
 * Get baseline configuration for oxc's `mangleProps` option, mirroring
 * {@link getTerserManglePropertiesConfig}.
 *
 * @param isDebug if true, produce readable `_$name$_`-style output names instead of minified ones
 * @returns an object with our baseline property mangling configuration
 */
function getOxcManglePropertiesConfig(isDebug: boolean): OxcMinifyOptions['mangleProps'] {
  return {
    include: /^\$.+\$$/,
    reserved: ['$hostElement$', ...RESERVED_CMP_META_PROPS],
    debug: isDebug,
  };
}

/**
 * This method is likely to be called by a worker on the compiler context, rather than directly.
 * @param input the source code to minify
 * @param minifyOpts options to be used by the minifier
 * @returns minified input, as JavaScript
 */
export const prepareModule = async (
  input: string,
  minifyOpts: MinifyOptions,
): Promise<OptimizeJsResult> => {
  if (minifyOpts) {
    return minifyJs(input, minifyOpts);
  }

  return {
    output: input,
    diagnostics: [],
    sourceMap: null,
  };
};
