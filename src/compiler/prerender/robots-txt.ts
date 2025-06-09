import { catchError, join } from '@utils';

import type * as d from '../../declarations';
import { getSitemapUrls } from './sitemap-xml';

export const generateRobotsTxt = async (manager: d.PrerenderManager, sitemapResults: d.SitemapXmpResults) => {
  if (manager.prerenderConfig.robotsTxt === null) {
    // if it's set to null then let's not create a robots.txt file
    return null;
  }

  try {
    if (typeof manager.prerenderConfig.robotsTxt !== 'function') {
      // not set to null, but also no config.robotsTxt(), so let's make a default
      manager.prerenderConfig.robotsTxt = function robotsTxt(opts) {
        const content = [`User-agent: *`, `Disallow:`];
        if (typeof opts.sitemapUrl === 'string') {
          content.push(`Sitemap: ${opts.sitemapUrl}`);
        }
        return content.join('\n');
      };
    }

    const opts: d.RobotsTxtOpts = {
      urls: getSitemapUrls(manager),
      baseUrl: manager.outputTarget.baseUrl,
      sitemapUrl: sitemapResults ? sitemapResults.url : null,
      dir: manager.outputTarget.dir,
    };

    const userResults = manager.prerenderConfig.robotsTxt(opts);
    if (userResults == null) {
      return null;
    }

    const results: d.RobotsTxtResults = {
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

    const lines = results.content.replace(/\r/g, '\n').split('\n');
    results.content = lines.map((l) => l.trim()).join('\n');

    if (typeof results.filePath !== 'string') {
      results.filePath = join(manager.outputTarget.dir, `robots.txt`);
    }

    if (typeof results.url !== 'string') {
      const robotsTxtUrl = new URL(`/robots.txt`, manager.outputTarget.baseUrl);
      results.url = robotsTxtUrl.href;
    }

    await manager.config.sys.writeFile(results.filePath, results.content);

    return results;
  } catch (e: any) {
    catchError(manager.diagnostics, e);
    return null;
  }
};
