import { buildError, catchError, isFunction, isString, relative } from '@utils';

import type * as d from '../../declarations';
import { crawlAnchorsForNextUrls } from './crawl-urls';
import { getWriteFilePathFromUrlPath } from './prerendered-write-path';

export const initializePrerenderEntryUrls = (results: d.PrerenderResults, manager: d.PrerenderManager) => {
  const entryAnchors: d.HydrateAnchorElement[] = [];

  if (Array.isArray(manager.prerenderConfig.entryUrls)) {
    for (const entryUrl of manager.prerenderConfig.entryUrls) {
      const entryAnchor: d.HydrateAnchorElement = {
        href: entryUrl,
      };
      entryAnchors.push(entryAnchor);
    }
  } else {
    const entryAnchor: d.HydrateAnchorElement = {
      href: manager.outputTarget.baseUrl,
    };
    entryAnchors.push(entryAnchor);
  }

  for (const entryAnchor of entryAnchors) {
    // ensure each entry url is valid
    // and has a domain
    try {
      new URL(entryAnchor.href, manager.outputTarget.baseUrl);
    } catch (e) {
      const diagnostic = buildError(results.diagnostics);
      diagnostic.header = `Invalid Prerender Entry Url: ${entryAnchor.href}`;
      diagnostic.messageText = `Entry Urls must include the protocol and domain of the site being prerendered.`;
      return;
    }
  }

  const base = new URL(manager.outputTarget.baseUrl);

  const hrefs = crawlAnchorsForNextUrls(manager.prerenderConfig, results.diagnostics, base, base, entryAnchors);
  for (const href of hrefs) {
    addUrlToPendingQueue(manager, href, '#entryUrl');
  }
};

const addUrlToPendingQueue = (manager: d.PrerenderManager, queueUrl: string, fromUrl: string) => {
  if (!isString(queueUrl) || queueUrl === '') {
    return;
  }
  if (manager.urlsPending.has(queueUrl)) {
    return;
  }
  if (manager.urlsProcessing.has(queueUrl)) {
    return;
  }
  if (manager.urlsCompleted.has(queueUrl)) {
    return;
  }

  manager.urlsPending.add(queueUrl);

  if (manager.isDebug) {
    const url = new URL(queueUrl, manager.outputTarget.baseUrl).pathname;
    const from = fromUrl.startsWith('#') ? fromUrl : new URL(fromUrl, manager.outputTarget.baseUrl).pathname;
    manager.config.logger.debug(`prerender queue: ${url} (from ${from})`);
  }
};

export const drainPrerenderQueue = (results: d.PrerenderResults, manager: d.PrerenderManager) => {
  const nextUrl = manager.urlsPending.values().next();
  if (!nextUrl.done) {
    if (manager.urlsProcessing.size > manager.maxConcurrency) {
      // slow it down there buddy, too many at one time
      setTimeout(() => drainPrerenderQueue(results, manager));
    } else {
      const url = nextUrl.value;

      // looks like we're ready to prerender more
      // remove from pending
      manager.urlsPending.delete(url);

      // move to processing
      manager.urlsProcessing.add(url);

      // kick off async prerendering
      prerenderUrl(results, manager, url);

      if (manager.urlsProcessing.size < manager.maxConcurrency) {
        // could be more ready for prerendering
        // let's check again after a tick
        manager.config.sys.nextTick(() => drainPrerenderQueue(results, manager));
      }
    }
  }

  if (manager.urlsProcessing.size === 0 && manager.urlsPending.size === 0) {
    if (isFunction(manager.resolve)) {
      // we're not actively processing anything
      // and there aren't anymore urls in the queue to be prerendered
      // so looks like our job here is done, good work team
      manager.resolve();
      manager.resolve = null;
    }
  }
};

const prerenderUrl = async (results: d.PrerenderResults, manager: d.PrerenderManager, url: string) => {
  let previewUrl = url;
  try {
    previewUrl = new URL(url).pathname;
    let timespan: d.LoggerTimeSpan;
    if (manager.isDebug) {
      timespan = manager.config.logger.createTimeSpan(`prerender start: ${previewUrl}`, true);
    }

    const prerenderRequest: d.PrerenderUrlRequest = {
      appDir: manager.outputTarget.appDir,
      baseUrl: manager.outputTarget.baseUrl,
      buildId: results.buildId,
      componentGraphPath: manager.componentGraphPath,
      devServerHostUrl: manager.devServerHostUrl,
      hydrateAppFilePath: manager.hydrateAppFilePath,
      isDebug: manager.isDebug,
      prerenderConfigPath: manager.prerenderConfigPath,
      staticSite: manager.staticSite,
      templateId: manager.templateId,
      url: url,
      writeToFilePath: getWriteFilePathFromUrlPath(manager, url),
    };

    // prerender this path and wait on the results
    const urlResults = await manager.prerenderUrlWorker(prerenderRequest);

    if (manager.isDebug) {
      const filePath = relative(manager.config.rootDir, urlResults.filePath);
      const hasError = urlResults.diagnostics.some((d) => d.level === 'error');
      if (hasError) {
        timespan.finish(`prerender failed: ${previewUrl}, ${filePath}`, 'red');
      } else {
        timespan.finish(`prerender finish: ${previewUrl}, ${filePath}`);
      }
    }

    manager.diagnostics.push(...urlResults.diagnostics);

    if (Array.isArray(urlResults.anchorUrls)) {
      for (const anchorUrl of urlResults.anchorUrls) {
        addUrlToPendingQueue(manager, anchorUrl, url);
      }
    }
  } catch (e: any) {
    // darn, idk, bad news
    catchError(manager.diagnostics, e);
  }

  manager.urlsProcessing.delete(url);
  manager.urlsCompleted.add(url);

  results.urls++;

  const urlsCompletedSize = manager.urlsCompleted.size;
  if (manager.progressLogger && urlsCompletedSize > 1) {
    manager.progressLogger.update(
      `           prerendered ${urlsCompletedSize} urls: ${manager.config.logger.dim(previewUrl)}`,
    );
  }

  // let's try to drain the queue again and let this
  // next call figure out if we're actually done or not
  manager.config.sys.nextTick(() => drainPrerenderQueue(results, manager));
};
