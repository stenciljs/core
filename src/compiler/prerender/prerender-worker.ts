import { catchError, isFunction, isRootPath, join, normalizePath } from '@utils';
import { dirname } from 'path';

import type * as d from '../../declarations';
import { crawlAnchorsForNextUrls } from './crawl-urls';
import { getPrerenderConfig } from './prerender-config';
import { getHydrateOptions } from './prerender-hydrate-options';
import {
  addModulePreloads,
  excludeStaticComponents,
  hashAssets,
  minifyScriptElements,
  minifyStyleElements,
  removeModulePreloads,
  removeStencilScripts,
} from './prerender-optimize';
import { getPrerenderCtx, PrerenderContext } from './prerender-worker-ctx';

export const prerenderWorker = async (sys: d.CompilerSystem, prerenderRequest: d.PrerenderUrlRequest) => {
  // worker thread!
  const results: d.PrerenderUrlResults = {
    diagnostics: [],
    anchorUrls: [],
    filePath: prerenderRequest.writeToFilePath,
  };

  try {
    const prerenderCtx = getPrerenderCtx(prerenderRequest);

    const url = new URL(prerenderRequest.url, prerenderRequest.devServerHostUrl);
    const baseUrl = new URL(prerenderRequest.baseUrl);
    const componentGraph = getComponentGraph(sys, prerenderCtx, prerenderRequest.componentGraphPath);

    // webpack work-around/hack
    const hydrateApp = require(prerenderRequest.hydrateAppFilePath);

    if (prerenderCtx.templateHtml == null) {
      // cache template html in this process
      prerenderCtx.templateHtml = sys.readFileSync(prerenderRequest.templateId);
    }

    // create a new window by cloning the cached parsed window
    const win = hydrateApp.createWindowFromHtml(prerenderCtx.templateHtml, prerenderRequest.templateId);
    const doc = win.document;
    win.location.href = url.href;

    // patch this new window
    if (isFunction(sys.applyPrerenderGlobalPatch)) {
      sys.applyPrerenderGlobalPatch({
        devServerHostUrl: prerenderRequest.devServerHostUrl,
        window: win,
      });
    }

    if (prerenderCtx.prerenderConfig == null) {
      prerenderCtx.prerenderConfig = getPrerenderConfig(results.diagnostics, prerenderRequest.prerenderConfigPath);
    }
    const prerenderConfig = prerenderCtx.prerenderConfig;

    const hydrateOpts = getHydrateOptions(prerenderConfig, url, results.diagnostics);

    if (prerenderRequest.staticSite || hydrateOpts.staticDocument) {
      hydrateOpts.addModulePreloads = false;
      hydrateOpts.clientHydrateAnnotations = false;
    }

    if (typeof hydrateOpts.buildId !== 'string') {
      hydrateOpts.buildId = prerenderRequest.buildId;
    }

    if (typeof prerenderConfig.beforeHydrate === 'function') {
      try {
        await prerenderConfig.beforeHydrate(doc, url);
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    }

    // parse the html to dom nodes, hydrate the components, then
    // serialize the hydrated dom nodes back to into html
    const hydrateResults: d.HydrateResults = await hydrateApp.hydrateDocument(doc, hydrateOpts);
    results.diagnostics.push(...hydrateResults.diagnostics);

    if (typeof prerenderConfig.filePath === 'function') {
      try {
        const userWriteToFilePath = prerenderConfig.filePath(url, results.filePath);
        if (typeof userWriteToFilePath === 'string') {
          results.filePath = userWriteToFilePath;
        }
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    }

    if (hydrateOpts.staticDocument) {
      removeStencilScripts(doc);
      removeModulePreloads(doc);
    } else {
      if (Array.isArray(hydrateOpts.staticComponents)) {
        excludeStaticComponents(doc, hydrateOpts, hydrateResults);
      }

      if (hydrateOpts.addModulePreloads) {
        if (!prerenderRequest.isDebug && componentGraph) {
          addModulePreloads(doc, hydrateOpts, hydrateResults, componentGraph);
        }
      } else {
        // remove module preloads
        removeModulePreloads(doc);
      }
    }

    const docPromises: Promise<any>[] = [];
    if (hydrateOpts.minifyStyleElements && !prerenderRequest.isDebug) {
      docPromises.push(minifyStyleElements(sys, prerenderRequest.appDir, doc, url, false));
    }

    if (hydrateOpts.minifyScriptElements && !prerenderRequest.isDebug) {
      docPromises.push(minifyScriptElements(doc, false));
    }

    if (hydrateOpts.hashAssets && !prerenderRequest.isDebug) {
      try {
        docPromises.push(
          hashAssets(sys, prerenderCtx, results.diagnostics, hydrateOpts, prerenderRequest.appDir, doc, url),
        );
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    }

    if (docPromises.length > 0) {
      await Promise.all(docPromises);
    }

    if (prerenderConfig.crawlUrls !== false) {
      results.anchorUrls = crawlAnchorsForNextUrls(
        prerenderConfig,
        results.diagnostics,
        baseUrl,
        url,
        hydrateResults.anchors,
      );
    }

    if (typeof prerenderConfig.afterHydrate === 'function') {
      try {
        await prerenderConfig.afterHydrate(doc, url, results);
      } catch (e: any) {
        catchError(results.diagnostics, e);
      }
    }

    if (typeof hydrateResults.httpStatus === 'number' && hydrateResults.httpStatus >= 400) {
      try {
        win.close();
      } catch (e) {}
      return results;
    }

    const html = await hydrateApp.serializeDocumentToString(doc, hydrateOpts);

    prerenderEnsureDir(sys, prerenderCtx, results.filePath);

    const writePromise = sys.writeFile(results.filePath, html);

    if (Array.isArray(hydrateResults.staticData) && hydrateResults.staticData.length > 0) {
      const pageDir = dirname(results.filePath);

      await Promise.all(
        hydrateResults.staticData.map(async (s) => {
          if (s.type === 'application/json') {
            const data: any = {
              [s.id]: JSON.parse(s.content),
              components: hydrateResults.components.map((c) => c.tag),
            };
            const dataFileName = `${s.id}.json`;
            const dataFilePath = join(pageDir, dataFileName);
            await sys.writeFile(dataFilePath, JSON.stringify(data));
          } else {
            const contentFileName = `${s.id}.txt`;
            const contentFilePath = join(pageDir, contentFileName);
            await sys.writeFile(contentFilePath, s.content);
          }
        }),
      );
    }

    await writePromise;

    try {
      win.close();
    } catch (e) {}
  } catch (e: any) {
    // ahh man! what happened!
    catchError(results.diagnostics, e);
  }

  return results;
};

const getComponentGraph = (sys: d.CompilerSystem, prerenderCtx: PrerenderContext, componentGraphPath: string) => {
  if (componentGraphPath == null) {
    return undefined;
  }
  if (prerenderCtx.componentGraph == null) {
    const componentGraphJson = JSON.parse(sys.readFileSync(componentGraphPath));
    prerenderCtx.componentGraph = new Map<string, string[]>(Object.entries(componentGraphJson));
  }
  return prerenderCtx.componentGraph;
};

const prerenderEnsureDir = (sys: d.CompilerSystem, prerenderCtx: PrerenderContext, p: string) => {
  const allDirs: string[] = [];

  while (true) {
    p = normalizePath(sys.platformPath.dirname(p));
    if (typeof p === 'string' && p.length > 0 && !isRootPath(p)) {
      allDirs.push(p);
    } else {
      break;
    }
  }

  allDirs.reverse();

  for (let i = 0; i < allDirs.length; i++) {
    const dir = allDirs[i];
    if (!prerenderCtx.ensuredDirs.has(dir)) {
      prerenderCtx.ensuredDirs.add(dir);
      sys.createDirSync(dir);
    }
  }
};
