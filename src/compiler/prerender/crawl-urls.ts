import { catchError } from '@utils';

import type * as d from '../../declarations';

export const crawlAnchorsForNextUrls = (
  prerenderConfig: d.PrerenderConfig,
  diagnostics: d.Diagnostic[],
  baseUrl: URL,
  currentUrl: URL,
  parsedAnchors: d.HydrateAnchorElement[],
) => {
  if (!Array.isArray(parsedAnchors) || parsedAnchors.length === 0) {
    return [];
  }

  const basePathParts = baseUrl.pathname.split('/');

  // filterAnchor(): filter which anchors to actually crawl
  // normalizeUrl(): normalize href strings into URL objects
  // filterUrl(): filter which urls to actually crawl
  // normalizeHref(): normalize URL objects into href strings

  return parsedAnchors
    .filter((anchor) => {
      // filter which anchors to actually crawl
      if (typeof prerenderConfig.filterAnchor === 'function') {
        // user filterAnchor()
        try {
          const userFilterAnchor = prerenderConfig.filterAnchor(anchor, currentUrl);
          if (userFilterAnchor === false) {
            return false;
          }
        } catch (e: any) {
          // user filterAnchor() error
          catchError(diagnostics, e);
          return false;
        }
      }

      // standard filterAnchor()
      return standardFilterAnchor(diagnostics, anchor, currentUrl);
    })

    .map((anchor) => {
      // normalize href strings into URL objects
      if (typeof prerenderConfig.normalizeUrl === 'function') {
        try {
          // user normalizeUrl()
          const userNormalizedUrl = prerenderConfig.normalizeUrl(anchor.href, currentUrl);

          // standard normalizeUrl(), after user normalized
          return standardNormalizeUrl(diagnostics, userNormalizedUrl.href, currentUrl);
        } catch (e: any) {
          // user normalizeUrl() error
          catchError(diagnostics, e);
        }
      }

      // standard normalizeUrl(), no user normalized
      return standardNormalizeUrl(diagnostics, anchor.href, currentUrl);
    })

    .filter((url) => {
      // filter which urls to actually crawl
      if (typeof prerenderConfig.filterUrl === 'function') {
        // user filterUrl()
        try {
          const userFilterUrl = prerenderConfig.filterUrl(url, currentUrl);
          if (userFilterUrl === false) {
            return false;
          }
        } catch (e: any) {
          // user filterUrl() error
          catchError(diagnostics, e);
          return false;
        }
      }

      // standard filterUrl()
      return standardFilterUrl(diagnostics, url, currentUrl, basePathParts);
    })

    .map((url) => {
      // standard normalize href
      // normalize URL objects into href strings
      return standardNormalizeHref(prerenderConfig, diagnostics, url);
    })

    .reduce((hrefs, href) => {
      // remove any duplicate hrefs from the array
      if (!hrefs.includes(href)) {
        hrefs.push(href);
      }
      return hrefs;
    }, [] as string[])

    .sort((a: string, b: string) => {
      // sort the hrefs so the urls with the least amount
      // of directories are first, then by alphabetical
      const partsA = a.split('/').length;
      const partsB = b.split('/').length;
      if (partsA < partsB) return -1;
      if (partsA > partsB) return 1;
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
};

const standardFilterAnchor = (diagnostics: d.Diagnostic[], attrs: { [attrName: string]: string }, _base: URL) => {
  try {
    let href = attrs.href;
    if (typeof attrs.download === 'string') {
      return false;
    }
    if (typeof href === 'string') {
      href = href.trim();

      if (href !== '' && !href.startsWith('#') && !href.startsWith('?')) {
        const target = attrs.target;
        if (typeof target === 'string' && attrs.target.trim().toLowerCase() !== '_self') {
          return false;
        }
        return true;
      }
    }
  } catch (e: any) {
    catchError(diagnostics, e);
  }

  return false;
};

const standardNormalizeUrl = (diagnostics: d.Diagnostic[], href: string, currentUrl: URL) => {
  if (typeof href === 'string') {
    try {
      const outputUrl = new URL(href, currentUrl.href);
      outputUrl.protocol = currentUrl.href;
      outputUrl.hash = '';
      outputUrl.search = '';

      const parts = outputUrl.pathname.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart === 'index.html' || lastPart === 'index.htm') {
        parts.pop();
        outputUrl.pathname = parts.join('/');
      }

      return outputUrl;
    } catch (e: any) {
      catchError(diagnostics, e);
    }
  }
  return null;
};

const standardFilterUrl = (diagnostics: d.Diagnostic[], url: URL, currentUrl: URL, basePathParts: string[]) => {
  try {
    if (url.hostname != null && currentUrl.hostname != null && url.hostname !== currentUrl.hostname) {
      return false;
    }

    if (shouldSkipExtension(url.pathname)) {
      return false;
    }

    const inputPathParts = url.pathname.split('/');

    if (inputPathParts.length < basePathParts.length) {
      return false;
    }

    for (let i = 0; i < basePathParts.length; i++) {
      const basePathPart = basePathParts[i];
      const inputPathPart = inputPathParts[i];

      if (basePathParts.length - 1 === i && basePathPart === '') {
        break;
      }

      if (basePathPart !== inputPathPart) {
        return false;
      }
    }

    return true;
  } catch (e: any) {
    catchError(diagnostics, e);
  }
  return false;
};

export const standardNormalizeHref = (prerenderConfig: d.PrerenderConfig, diagnostics: d.Diagnostic[], url: URL) => {
  try {
    if (url != null && typeof url.href === 'string') {
      let href = url.href.trim();

      if (prerenderConfig.trailingSlash) {
        // url should have a trailing slash
        if (!href.endsWith('/')) {
          const parts = url.pathname.split('/');
          const lastPart = parts[parts.length - 1];
          if (!lastPart.includes('.')) {
            // does not end with a slash and last part does not have a dot
            href += '/';
          }
        }
      } else {
        // url should NOT have a trailing slash
        if (href.endsWith('/') && url.pathname !== '/') {
          // this has a trailing slash and it's not the root path
          href = href.slice(0, -1);
        }
      }

      return href;
    }
  } catch (e: any) {
    catchError(diagnostics, e);
  }

  return null;
};

const shouldSkipExtension = (filename: string) => SKIP_EXT.has(extname(filename).toLowerCase());

const extname = (str: string) => {
  const parts = str.split('.');
  return parts[parts.length - 1].toLowerCase();
};

const SKIP_EXT = new Set(['zip', 'rar', 'tar', 'gz', 'bz2', 'png', 'jpeg', 'jpg', 'gif', 'pdf', 'tiff', 'psd']);
