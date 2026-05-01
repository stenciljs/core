import type * as d from '@stencil/core';

import { catchError } from '../../utils';

export const getSsrOptions = (
  prerenderConfig: d.PrerenderConfig,
  url: URL,
  diagnostics: d.Diagnostic[],
) => {
  const prerenderUrl = url.href;

  const opts: d.PrerenderOptions = {
    url: prerenderUrl,
    addModulePreloads: true,
    approximateLineWidth: 100,
    hashAssets: 'querystring',
    inlineExternalStyleSheets: false,
    minifyScriptElements: true,
    minifyStyleElements: true,
    removeAttributeQuotes: true,
    removeBooleanAttributeQuotes: true,
    removeEmptyAttributes: true,
    removeHtmlComments: true,
  };

  if (prerenderConfig.canonicalUrl === null || (prerenderConfig.canonicalUrl as any) === false) {
    opts.canonicalUrl = null;
  } else if (typeof prerenderConfig.canonicalUrl === 'function') {
    try {
      opts.canonicalUrl = prerenderConfig.canonicalUrl(url);
    } catch (e: any) {
      catchError(diagnostics, e);
    }
  } else {
    opts.canonicalUrl = prerenderUrl;
  }

  if (typeof prerenderConfig.hydrateOptions === 'function') {
    try {
      const userOpts = prerenderConfig.hydrateOptions(url);
      if (userOpts != null) {
        if (userOpts.prettyHtml && typeof userOpts.removeAttributeQuotes !== 'boolean') {
          opts.removeAttributeQuotes = false;
        }
        Object.assign(opts, userOpts);
      }
    } catch (e: any) {
      catchError(diagnostics, e);
    }
  }

  return opts;
};
