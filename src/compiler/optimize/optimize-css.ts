import { hasError } from '@utils';

import { OptimizeCssInput, OptimizeCssOutput } from '../../declarations';
import { autoprefixCss } from './autoprefixer';
import { createCssSourceMap, minifyCss } from './minify-css';

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
    map: inputOpts.sourceMap ? inputOpts.map : undefined,
  };
  if (inputOpts.autoprefixer !== false && inputOpts.autoprefixer !== null) {
    result = await autoprefixCss(
      inputOpts.input,
      inputOpts.autoprefixer ?? null,
      inputOpts.sourceMap ? inputOpts.map : undefined,
      inputOpts.filePath,
    );
    if (hasError(result.diagnostics)) {
      return result;
    }
  }
  if (inputOpts.sourceMap && !result.map) {
    result.map = createCssSourceMap(result.output, result.output, inputOpts.filePath || 'input.css');
  }
  if (inputOpts.minify !== false) {
    const minifyResult = await minifyCss({
      css: result.output,
      filePath: inputOpts.filePath,
      map: result.map,
      sourceMap: inputOpts.sourceMap,
      resolveUrl: inputOpts.resolveUrl,
    });
    if (typeof minifyResult === 'string') {
      result.output = minifyResult;
    } else {
      result.output = minifyResult.output;
      result.map = minifyResult.map;
    }
  }
  return result;
};
