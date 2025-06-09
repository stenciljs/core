import { hasError, normalizePath } from '@utils';

import type * as d from '../../declarations';
import { optimizeCssId } from '../../version';

export const optimizeCss = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  diagnostics: d.Diagnostic[],
  styleText: string,
  // TODO(STENCIL-1076): Investigate removing this parameter, which appears to be unused. This function is exported by
  // the compiler, making this a breaking change should we remove it.
  filePath: string,
) => {
  if (typeof styleText !== 'string' || !styleText.length) {
    //  don't bother with invalid data
    return styleText;
  }

  if ((config.autoprefixCss === false || config.autoprefixCss === null) && !config.minifyCss) {
    // don't wanna autoprefix or minify, so just skip this
    return styleText;
  }

  if (typeof filePath === 'string') {
    filePath = normalizePath(filePath);
  }

  const opts: d.OptimizeCssInput = {
    input: styleText,
    filePath: filePath,
    autoprefixer: config.autoprefixCss,
    minify: config.minifyCss,
  };

  const cacheKey = await compilerCtx.cache.createKey('optimizeCss', optimizeCssId, opts);
  const cachedContent = await compilerCtx.cache.get(cacheKey);
  if (cachedContent != null) {
    // let's use the cached data we already figured out
    return cachedContent;
  }

  const minifyResults = await compilerCtx.worker!.optimizeCss(opts);
  minifyResults.diagnostics.forEach((d) => {
    // collect up any diagnostics from minifying
    diagnostics.push(d);
  });

  if (typeof minifyResults.output === 'string' && !hasError(diagnostics)) {
    // cool, we got valid minified output

    // only cache if we got a cache key, if not it probably has an @import
    await compilerCtx.cache.put(cacheKey, minifyResults.output);

    return minifyResults.output;
  }

  return styleText;
};
