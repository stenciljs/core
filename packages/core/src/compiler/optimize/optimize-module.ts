import type {
  CompilerCtx,
  OptimizeJsResult,
  SourceMap,
  SourceTarget,
  ValidatedConfig,
} from '@stencil/core';
import type { JsMinifyOptions, TerserCompressOptions } from '@swc/core';

import { getToolVersion } from '../../version';
import { minifyJs } from './minify-js';

interface OptimizeModuleOptions {
  input: string;
  sourceMap?: SourceMap;
  sourceTarget?: SourceTarget;
  isCore?: boolean;
  minify?: boolean;
  inlineHelpers?: boolean;
  modeName?: string;
}

// SWC types use `props` but the actual API uses `properties`
// See: https://swc.rs/docs/configuration/minification#jscminifymangleproperties
interface SwcMangleOptions {
  toplevel?: boolean;
  keepClassNames?: boolean;
  keepFnNames?: boolean;
  properties?: {
    regex?: string;
    reserved?: string[];
    undeclared?: boolean;
  };
}

interface SwcMinifyOptions extends Omit<JsMinifyOptions, 'mangle'> {
  mangle?: SwcMangleOptions | boolean;
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
  const cacheKey = await compilerCtx.cache.createKey(
    'optimizeModule',
    getToolVersion('@swc/core'),
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

  const minifyOpts = getSwcMinifyOptions(config, opts.sourceTarget, isDebug);

  if (config.sourceMap && opts.sourceMap != null) {
    minifyOpts.sourceMap = true;
    minifyOpts.inlineSourcesContent = true;
  }

  if (opts.isCore) {
    // Enable more aggressive compression for core
    const compress = minifyOpts.compress as TerserCompressOptions;
    if (compress && !isDebug) {
      compress.passes = 2;
      compress.global_defs = {
        supportsListenerOptions: true,
      };
      compress.pure_funcs = ['getHostRef'];
      compress.inline = 1;
      compress.unsafe = true;
      compress.unsafe_undefined = true;
    }
  }

  const results = await compilerCtx.worker.prepareModule(opts.input, minifyOpts);
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
 * Get baseline configuration for property mangling.
 * Properties matching the $...$ pattern will be mangled.
 *
 * @returns an object with our baseline property mangling configuration
 */
function getManglePropertiesConfig() {
  return {
    regex: '^\\$.+\\$$',
    // Reserve $hostElement$ since it's accessed dynamically at runtime
    reserved: ['$hostElement$'],
  };
}

/**
 * Builds a configuration object to be used by SWC for the purposes of minifying a user's JavaScript
 * @param config the Stencil configuration file that was provided as a part of the build step
 * @param sourceTarget the version of JavaScript being targeted (e.g. ES2017)
 * @param prettyOutput if true, set the necessary flags to beautify the output
 * @returns the minification options
 */
export const getSwcMinifyOptions = (
  config: ValidatedConfig,
  sourceTarget: SourceTarget | undefined,
  prettyOutput: boolean,
): SwcMinifyOptions => {
  const opts: SwcMinifyOptions = {
    ecma: 2018,
    module: true,
    toplevel: true,
    sourceMap: config.sourceMap,
    // Property mangling is applied to ALL builds (not just core)
    // This mangles $foo$ style internal properties
    mangle: {
      toplevel: true,
      properties: getManglePropertiesConfig(),
    },
    compress: {
      toplevel: true,
      module: true,
      arrows: true,
      passes: 2,
      pure_getters: true,
      keep_fargs: false,
    },
  };

  if (prettyOutput) {
    opts.mangle = {
      keepClassNames: true,
      keepFnNames: true,
      properties: getManglePropertiesConfig(),
    };
    opts.compress = false;
    opts.format = {
      comments: 'all',
    };
  }

  return opts;
};

/**
 * This method is likely to be called by a worker on the compiler context, rather than directly.
 * @param input the source code to minify
 * @param minifyOpts options to be used by the minifier
 * @returns minified input, as JavaScript
 */
export const prepareModule = async (
  input: string,
  minifyOpts: SwcMinifyOptions,
): Promise<OptimizeJsResult> => {
  if (minifyOpts) {
    return minifyJs(input, minifyOpts as JsMinifyOptions);
  }

  return {
    output: input,
    diagnostics: [],
    sourceMap: null,
  };
};
