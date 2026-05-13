import { catchError } from '@stencil/core/compiler/utils';
import type {
  BuildResultsComponentGraph,
  Diagnostic,
  ValidatedConfig,
} from '@stencil/core/compiler';

import { startupCompilerLog } from './logs';
import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';

export const taskPrerender = async (
  coreCompiler: CoreCompiler,
  config: ValidatedConfig,
  flags: ConfigFlags,
) => {
  startupCompilerLog(coreCompiler, config);

  const ssrAppFilePath = flags.unknownArgs[0];

  if (typeof ssrAppFilePath !== 'string') {
    config.logger.error(`Missing hydrate app script path`);
    return config.sys.exit(1);
  }

  const srcIndexHtmlPath = config.srcIndexHtml;

  const diagnostics = await runPrerenderTask(
    coreCompiler,
    config,
    ssrAppFilePath,
    undefined,
    srcIndexHtmlPath,
  );
  config.logger.printDiagnostics(diagnostics);

  if (diagnostics.some((d) => d.level === 'error')) {
    return config.sys.exit(1);
  }
};

export const runPrerenderTask = async (
  coreCompiler: CoreCompiler,
  config: ValidatedConfig,
  ssrAppFilePath?: string,
  componentGraph?: BuildResultsComponentGraph,
  srcIndexHtmlPath?: string,
) => {
  const diagnostics: Diagnostic[] = [];

  try {
    const prerenderer = await coreCompiler.createPrerenderer(config);
    const results = await prerenderer.start({
      ssrAppFilePath,
      componentGraph,
      srcIndexHtmlPath,
    });

    diagnostics.push(...results.diagnostics);
  } catch (e: any) {
    catchError(diagnostics, e);
  }

  return diagnostics;
};
