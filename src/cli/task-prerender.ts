import { catchError } from '@utils';

import type { BuildResultsComponentGraph, Diagnostic, ValidatedConfig } from '../declarations';
import type { CoreCompiler } from './load-compiler';
import { startupCompilerLog } from './logs';

export const taskPrerender = async (coreCompiler: CoreCompiler, config: ValidatedConfig) => {
  startupCompilerLog(coreCompiler, config);

  const hydrateAppFilePath = config.flags.unknownArgs[0];

  if (typeof hydrateAppFilePath !== 'string') {
    config.logger.error(`Missing hydrate app script path`);
    return config.sys.exit(1);
  }

  const srcIndexHtmlPath = config.srcIndexHtml;

  const diagnostics = await runPrerenderTask(coreCompiler, config, hydrateAppFilePath, undefined, srcIndexHtmlPath);
  config.logger.printDiagnostics(diagnostics);

  if (diagnostics.some((d) => d.level === 'error')) {
    return config.sys.exit(1);
  }
};

export const runPrerenderTask = async (
  coreCompiler: CoreCompiler,
  config: ValidatedConfig,
  hydrateAppFilePath?: string,
  componentGraph?: BuildResultsComponentGraph,
  srcIndexHtmlPath?: string,
) => {
  const diagnostics: Diagnostic[] = [];

  try {
    const prerenderer = await coreCompiler.createPrerenderer(config);
    const results = await prerenderer.start({
      hydrateAppFilePath,
      componentGraph,
      srcIndexHtmlPath,
    });

    diagnostics.push(...results.diagnostics);
  } catch (e: any) {
    catchError(diagnostics, e);
  }

  return diagnostics;
};
