import { catchError } from '@utils';

import type * as d from '../../declarations';

export const getHydrateOptions = (prerenderConfig: d.PrerenderConfig, url: URL, diagnostics: d.Diagnostic[]) => {
  const prerenderUrl = url.href;

  const opts: d.PrerenderHydrateOptions = {
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
