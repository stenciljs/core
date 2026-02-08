import { hasError } from '@utils';

import { OptimizeCssInput, OptimizeCssOutput } from '../../declarations';
import { autoprefixCss } from './autoprefixer';
import { minifyCss } from './minify-css';

/**
 * Optimize a CSS file, optionally running an autoprefixer and a minifier
 * depending on the options set on the input options argument.
 *
 * @param inputOpts input CSS options
 * @returns a promise wrapping the optimized output
 */
export const optimizeCss = async (inputOpts: OptimizeCssInput): Promise<OptimizeCssOutput> => {
  let result: OptimizeCssOutput = {
    output: inputOpts.input,
    diagnostics: [],
  };
  if (inputOpts.autoprefixer !== false && inputOpts.autoprefixer !== null) {
    result = await autoprefixCss(inputOpts.input, inputOpts.autoprefixer ?? null);
    if (hasError(result.diagnostics)) {
      return result;
    }
  }
  if (inputOpts.minify !== false) {
    result.output = await minifyCss({
      css: result.output,
      resolveUrl: inputOpts.resolveUrl,
    });
  }
  return result;
};
