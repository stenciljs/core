import type * as d from '../declarations';
import { printCheckVersionResults, startCheckVersion } from './check-version';
import type { CoreCompiler } from './load-compiler';
import { startupCompilerLog } from './logs';
import { runPrerenderTask } from './task-prerender';
import { taskWatch } from './task-watch';
import { telemetryBuildFinishedAction } from './telemetry/telemetry';

export const taskBuild = async (coreCompiler: CoreCompiler, config: d.ValidatedConfig) => {
  if (config.flags.watch) {
    // watch build
    await taskWatch(coreCompiler, config);
    return;
  }

  // one-time build
  let exitCode = 0;

  try {
    startupCompilerLog(coreCompiler, config);

    const versionChecker = startCheckVersion(config, coreCompiler.version);

    const compiler = await coreCompiler.createCompiler(config);
    const results = await compiler.build();

    await telemetryBuildFinishedAction(config.sys, config, coreCompiler, results);

    await compiler.destroy();

    if (results.hasError) {
      exitCode = 1;
    } else if (config.flags.prerender) {
      const prerenderDiagnostics = await runPrerenderTask(
        coreCompiler,
        config,
        results.hydrateAppFilePath,
        results.componentGraph,
        undefined,
      );
      config.logger.printDiagnostics(prerenderDiagnostics);

      if (prerenderDiagnostics.some((d) => d.level === 'error')) {
        exitCode = 1;
      }
    }

    await printCheckVersionResults(versionChecker);
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (exitCode > 0) {
    return config.sys.exit(exitCode);
  }
};
