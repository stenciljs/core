import { catchError } from '@utils';

import { Config, OptimizeJsInput, OptimizeJsOutput } from '../../declarations';
import { minifyJs } from './minify-js';
import { getTerserOptions } from './optimize-module';

/**
 * Utility function used by the compiler to optimize JavaScript. Knowing the
 * JavaScript target will further apply minification optimizations beyond usual
 * minification.
 *
 * @param inputOpts options to control how the JS optimization should take
 * place
 * @returns a promise wrapping an output object
 */
export const optimizeJs = async (inputOpts: OptimizeJsInput) => {
  const result: OptimizeJsOutput = {
    output: inputOpts.input,
    diagnostics: [],
    sourceMap: null,
  };

  try {
    const prettyOutput = !!inputOpts.pretty;
    const config: Config = {};
    const sourceTarget = inputOpts.target === 'es5' ? 'es5' : 'latest';
    const minifyOpts = getTerserOptions(config, sourceTarget, prettyOutput);

    const minifyResults = await minifyJs(inputOpts.input, minifyOpts);
    if (minifyResults.diagnostics.length > 0) {
      result.diagnostics.push(...minifyResults.diagnostics);
    } else {
      result.output = minifyResults.output;
      result.sourceMap = minifyResults.sourceMap;
    }
  } catch (e: any) {
    catchError(result.diagnostics, e);
  }

  return result;
};
