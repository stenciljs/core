import { buildError, catchError, hasError, isOutputTargetWww, isString, join } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../declarations';
import { createHydrateBuildId } from '../../hydrate/runner/render-utils';
import { getAbsoluteBuildDir } from '../html/html-utils';
import { createWorkerMainContext } from '../worker/main-thread';
import { createWorkerContext } from '../worker/worker-thread';
import { getPrerenderConfig } from './prerender-config';
import { getHydrateOptions } from './prerender-hydrate-options';
import { drainPrerenderQueue, initializePrerenderEntryUrls } from './prerender-queue';
import { generateTemplateHtml } from './prerender-template-html';
import { generateRobotsTxt } from './robots-txt';
import { generateSitemapXml } from './sitemap-xml';

export const createPrerenderer = async (config: d.ValidatedConfig) => {
  const start = (opts: d.PrerenderStartOptions) => {
    return runPrerender(config, opts.hydrateAppFilePath, opts.componentGraph, opts.srcIndexHtmlPath, opts.buildId);
  };
  return {
    start,
  };
};

const runPrerender = async (
  config: d.ValidatedConfig,
  hydrateAppFilePath: string,
  componentGraph: d.BuildResultsComponentGraph,
  srcIndexHtmlPath: string,
  buildId: string,
) => {
  const startTime = Date.now();
  const diagnostics: d.Diagnostic[] = [];
  const results: d.PrerenderResults = {
    buildId,
    diagnostics,
    urls: 0,
    duration: 0,
    average: 0,
  };
  const outputTargets = config.outputTargets.filter(isOutputTargetWww).filter((o) => isString(o.indexHtml));

  if (!isString(results.buildId)) {
    results.buildId = createHydrateBuildId();
  }

  if (outputTargets.length === 0) {
    return results;
  }

  if (!isString(hydrateAppFilePath)) {
    const diagnostic = buildError(diagnostics);
    diagnostic.header = `Prerender Error`;
    diagnostic.messageText = `Build results missing "hydrateAppFilePath"`;
  } else {
    if (!isAbsolute(hydrateAppFilePath)) {
      hydrateAppFilePath = join(config.sys.getCurrentDirectory(), hydrateAppFilePath);
    }

    const hydrateAppExists = await config.sys.access(hydrateAppFilePath);
    if (!hydrateAppExists) {
      const diagnostic = buildError(diagnostics);
      diagnostic.header = `Prerender Error`;
      diagnostic.messageText = `Unable to open "hydrateAppFilePath": ${hydrateAppFilePath}`;
    }
  }

  if (!hasError(diagnostics)) {
    let workerCtx: d.CompilerWorkerContext;
    let workerCtrl: d.WorkerMainController;

    if (config.sys.createWorkerController == null || config.maxConcurrentWorkers < 1) {
      // we don't have a `maxConcurrentWorkers` setting which makes it
      // necessary to actually use threaded workers, so we create a
      // single-threaded worker context here
      workerCtx = createWorkerContext(config.sys);
    } else {
      // we want to stand up the full threaded worker setup, so we first need
      // to build a worker controller and then we create an appropriate worker
      // context for it (this will mean that when methods are called on
      // `workerCtx` they're dispatched to workers in other threads)
      workerCtrl = config.sys.createWorkerController(config.maxConcurrentWorkers);
      workerCtx = createWorkerMainContext(workerCtrl);
    }

    const devServerConfig = { ...config.devServer };
    devServerConfig.openBrowser = false;
    devServerConfig.gzip = false;
    devServerConfig.logRequests = false;
    devServerConfig.reloadStrategy = null;

    const devServerPath = config.sys.getDevServerExecutingPath();
    const { start }: typeof import('@stencil/core/dev-server') = await config.sys.dynamicImport(devServerPath);
    const devServer = await start(devServerConfig, config.logger);

    try {
      await Promise.all(
        outputTargets.map((outputTarget) => {
          return runPrerenderOutputTarget(
            workerCtx,
            results,
            diagnostics,
            config,
            devServer,
            hydrateAppFilePath,
            componentGraph,
            srcIndexHtmlPath,
            outputTarget,
          );
        }),
      );
    } catch (e: any) {
      catchError(diagnostics, e);
    }

    if (workerCtrl) {
      workerCtrl.destroy();
    }
    if (devServer) {
      await devServer.close();
    }
  }

  results.duration = Date.now() - startTime;
  if (results.urls > 0) {
    results.average = results.duration / results.urls;
  }

  return results;
};

const runPrerenderOutputTarget = async (
  workerCtx: d.CompilerWorkerContext,
  results: d.PrerenderResults,
  diagnostics: d.Diagnostic[],
  config: d.ValidatedConfig,
  devServer: d.DevServer,
  hydrateAppFilePath: string,
  componentGraph: d.BuildResultsComponentGraph,
  srcIndexHtmlPath: string,
  outputTarget: d.OutputTargetWww,
) => {
  try {
    const timeSpan = config.logger.createTimeSpan(`prerendering started`);

    const devServerBaseUrl = new URL(devServer.browserUrl);
    const devServerHostUrl = devServerBaseUrl.origin;
    const prerenderConfig = getPrerenderConfig(diagnostics, outputTarget.prerenderConfig);

    const hydrateOpts = getHydrateOptions(prerenderConfig, devServerBaseUrl, diagnostics);

    config.logger.debug(`prerender hydrate app: ${hydrateAppFilePath}`);
    config.logger.debug(`prerender dev server: ${devServerHostUrl}`);

    if (hasError(diagnostics)) {
      return;
    }

    // get the prerender urls to queue up
    const prerenderDiagnostics: d.Diagnostic[] = [];
    const manager: d.PrerenderManager = {
      prerenderUrlWorker: (prerenderRequest: d.PrerenderUrlRequest) => workerCtx.prerenderWorker(prerenderRequest),
      componentGraphPath: null,
      config: config,
      diagnostics: prerenderDiagnostics,
      devServerHostUrl: devServerHostUrl,
      hydrateAppFilePath: hydrateAppFilePath,
      isDebug: config.logLevel === 'debug',
      logCount: 0,
      maxConcurrency: Math.max(20, config.maxConcurrentWorkers * 10),
      outputTarget: outputTarget,
      prerenderConfig: prerenderConfig,
      prerenderConfigPath: outputTarget.prerenderConfig,
      staticSite: false,
      templateId: null,
      urlsCompleted: new Set(),
      urlsPending: new Set(),
      urlsProcessing: new Set(),
      resolve: null,
    };

    if (!config.flags.ci && !manager.isDebug) {
      manager.progressLogger = await config.logger.createLineUpdater();
    }

    initializePrerenderEntryUrls(results, manager);

    if (manager.urlsPending.size === 0) {
      const err = buildError(diagnostics);
      err.messageText = `prerendering failed: no urls found in the prerender config`;
      return;
    }

    const templateData = await generateTemplateHtml(
      config,
      prerenderConfig,
      diagnostics,
      manager.isDebug,
      srcIndexHtmlPath,
      outputTarget,
      hydrateOpts,
      manager,
    );
    if (diagnostics.length > 0 || !templateData || !isString(templateData.html)) {
      return;
    }

    manager.templateId = await createPrerenderTemplate(config, templateData.html);
    manager.staticSite = templateData.staticSite;
    manager.componentGraphPath = await createComponentGraphPath(config, componentGraph, outputTarget);

    await new Promise((resolve) => {
      manager.resolve = resolve;
      config.sys.nextTick(() => drainPrerenderQueue(results, manager));
    });

    if (manager.isDebug) {
      const debugDiagnostics = prerenderDiagnostics.filter((d) => d.level === 'debug');
      if (debugDiagnostics.length > 0) {
        config.logger.printDiagnostics(debugDiagnostics);
      }
    }

    const duration = timeSpan.duration();

    const sitemapResults = await generateSitemapXml(manager);
    await generateRobotsTxt(manager, sitemapResults);

    const prerenderBuildErrors = prerenderDiagnostics.filter((d) => d.level === 'error');
    const prerenderRuntimeErrors = prerenderDiagnostics.filter((d) => d.type === 'runtime');

    if (prerenderBuildErrors.length > 0) {
      // convert to just runtime errors so the other build files still write
      // but the CLI knows an error occurred and should have an exit code 1
      for (const diagnostic of prerenderBuildErrors) {
        diagnostic.type = 'runtime';
      }
      diagnostics.push(...prerenderBuildErrors);
    }
    diagnostics.push(...prerenderRuntimeErrors);

    // Clear progress logger
    if (manager.progressLogger) {
      await manager.progressLogger.stop();
    }

    const totalUrls = manager.urlsCompleted.size;
    if (totalUrls > 1) {
      const average = Math.round(duration / totalUrls);
      config.logger.info(`prerendered ${totalUrls} urls, averaging ${average} ms per url`);
    }

    const statusMessage = prerenderBuildErrors.length > 0 ? 'failed' : 'finished';
    const statusColor = prerenderBuildErrors.length > 0 ? 'red' : 'green';

    timeSpan.finish(`prerendering ${statusMessage}`, statusColor, true);
  } catch (e: any) {
    catchError(diagnostics, e);
  }
};

const createPrerenderTemplate = async (config: d.ValidatedConfig, templateHtml: string) => {
  const hash = await config.sys.generateContentHash(templateHtml, 12);
  const templateFileName = `prerender-${hash}.html`;
  const templateId = join(config.sys.tmpDirSync(), templateFileName);
  config.logger.debug(`prerender template: ${templateId}`);
  config.sys.writeFileSync(templateId, templateHtml);
  return templateId;
};

const createComponentGraphPath = async (
  config: d.ValidatedConfig,
  componentGraph: d.BuildResultsComponentGraph,
  outputTarget: d.OutputTargetWww,
) => {
  if (componentGraph) {
    const content = getComponentPathContent(componentGraph, outputTarget);
    const hash = await config.sys.generateContentHash(content);
    const fileName = `prerender-component-graph-${hash}.json`;
    const componentGraphPath = join(config.sys.tmpDirSync(), fileName);
    config.sys.writeFileSync(componentGraphPath, content);
    return componentGraphPath;
  }
  return null;
};

const getComponentPathContent = (componentGraph: { [scopeId: string]: string[] }, outputTarget: d.OutputTargetWww) => {
  const buildDir = getAbsoluteBuildDir(outputTarget);
  const object: { [key: string]: string[] } = {};
  const entries = Object.entries(componentGraph);
  for (const [key, chunks] of entries) {
    object[key] = chunks.map((filename) => join(buildDir, filename));
  }
  return JSON.stringify(object);
};
