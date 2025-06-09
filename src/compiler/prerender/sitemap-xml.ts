import { catchError, join } from '@utils';

import type * as d from '../../declarations';

export const generateSitemapXml = async (manager: d.PrerenderManager) => {
  if (manager.prerenderConfig.sitemapXml === null) {
    // if it's set to null then let's not create a sitemap.xml file
    return null;
  }

  try {
    if (typeof manager.prerenderConfig.sitemapXml !== 'function') {
      // not set to null, but also no config.sitemapXml(), so let's make a default
      manager.prerenderConfig.sitemapXml = function sitemapXml(opts) {
        const content = [];
        content.push(`<?xml version="1.0" encoding="UTF-8"?>`);
        content.push(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);

        for (const url of opts.urls) {
          content.push(`<url><loc>${url}</loc></url>`);
        }

        content.push(`</urlset>`);
        return content.join('\n');
      };
    }

    const opts: d.SitemapXmpOpts = {
      urls: getSitemapUrls(manager),
      baseUrl: manager.outputTarget.baseUrl,
      dir: manager.outputTarget.appDir,
    };

    const userResults = manager.prerenderConfig.sitemapXml(opts);
    if (userResults == null) {
      return null;
    }

    const results: d.SitemapXmpResults = {
      content: null,
      filePath: null,
      url: null,
    };

    if (typeof userResults === 'string') {
      results.content = userResults;
    } else {
      results.content = userResults.content;
      results.filePath = userResults.filePath;
    }

    if (typeof results.content !== 'string') {
      return null;
    }

    if (typeof results.filePath !== 'string') {
      results.filePath = join(manager.outputTarget.appDir, `sitemap.xml`);
    }

    if (typeof results.url !== 'string') {
      const sitemapUrl = new URL(`sitemap.xml`, manager.outputTarget.baseUrl);
      results.url = sitemapUrl.href;
    }

    await manager.config.sys.writeFile(results.filePath, results.content);

    return results;
  } catch (e: any) {
    catchError(manager.diagnostics, e);
    return null;
  }
};

export const getSitemapUrls = (manager: d.PrerenderManager) => {
  const urls: string[] = [];

  if (typeof manager.prerenderConfig.canonicalUrl === 'function') {
    // user provide a canonicalUrl() function
    // use that to normalize the urls for the sitemap.xml
    // if it returned null then don't add it to the sitemap
    for (const url of manager.urlsCompleted) {
      const canonicalUrl = manager.prerenderConfig.canonicalUrl(new URL(url));
      if (typeof canonicalUrl === 'string' && canonicalUrl.trim() !== '') {
        urls.push(canonicalUrl);
      }
    }
  } else {
    for (const url of manager.urlsCompleted) {
      if (typeof url === 'string') {
        urls.push(url);
      }
    }
  }

  return urls.sort(sortUrls);
};

const sortUrls = (a: string, b: string) => {
  const partsA = a.split('/').length;
  const partsB = b.split('/').length;
  if (partsA < partsB) return -1;
  if (partsA > partsB) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};
