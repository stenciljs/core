import { hasError, isFunction, result, shouldIgnoreError } from '@stencil/core/compiler/utils';

import type * as d from '@stencil/core';
import { ValidatedConfig } from '@stencil/core';
import { ConfigFlags, createConfigFlags } from './config-flags';
import { findConfig } from './find-config';
import { mergeFlags } from './merge-flags';
import { CoreCompiler, loadCoreCompiler } from './load-compiler';
import { loadedCompilerLog, startupLog, startupLogVersion } from './logs';
import { parseFlags } from './parse-flags';
import { taskBuild } from './task-build';
import { taskDocs } from './task-docs';
import { taskGenerate } from './task-generate';
import { taskHelp } from './task-help';
import { taskInfo } from './task-info';
import { taskPrerender } from './task-prerender';
import { taskServe } from './task-serve';
import { taskTelemetry } from './task-telemetry';
import { telemetryAction } from './telemetry/telemetry';

/**
 * Main entry point for the Stencil CLI
 *
 * Take care of parsing CLI arguments, initializing various components needed
 * by the rest of the program, and kicking off the correct task (build, test,
 * etc).
 *
 * @param init initial CLI options
 * @returns an empty promise
 */
export const run = async (init: d.CliInitOptions) => {
  const { args, logger, sys } = init;

  try {
    const flags = parseFlags(args);
    const task = flags.task;

    if (flags.debug || flags.verbose) {
      logger.setLevel('debug');
    }

    if (flags.ci) {
      logger.enableColors(false);
    }

    if (isFunction(sys.applyGlobalPatch)) {
      sys.applyGlobalPatch(sys.getCurrentDirectory());
    }

    if ((task && task === 'version') || flags.version) {
      // we need to load the compiler here to get the version, but we don't
      // want to load it in the case that we're going to just log the help
      // message and then exit below (if there's no `task` defined) so we load
      // it just within our `if` scope here.
      const coreCompiler = await loadCoreCompiler(sys);
      console.log(coreCompiler.version);
      return;
    }

    if (!task || task === 'help' || flags.help) {
      await taskHelp(createConfigFlags({ task: 'help', args }), logger, sys);

      return;
    }

    startupLog(logger, task);

    const findConfigResults = await findConfig({ sys, configPath: flags.config });
    if (findConfigResults.isErr) {
      logger.printDiagnostics(findConfigResults.value);
      return sys.exit(1);
    }

    const coreCompiler = await loadCoreCompiler(sys);

    startupLogVersion(logger, task, coreCompiler);

    loadedCompilerLog(sys, logger, flags, coreCompiler);

    if (task === 'info') {
      taskInfo(coreCompiler, sys, logger);
      return;
    }

    const foundConfig = result.unwrap(findConfigResults);
    // Merge CLI flags into a base config object before passing to Core.
    // Core doesn't need to know about flags - it just receives config values.
    const configWithFlags = mergeFlags({}, flags);
    const validated = await coreCompiler.loadConfig({
      config: configWithFlags,
      configPath: foundConfig.configPath,
      logger,
      sys,
    });

    if (validated.diagnostics.length > 0) {
      logger.printDiagnostics(validated.diagnostics);
      if (hasError(validated.diagnostics)) {
        return sys.exit(1);
      }
    }

    if (isFunction(sys.applyGlobalPatch)) {
      sys.applyGlobalPatch(validated.config.rootDir);
    }

    await telemetryAction(sys, validated.config, coreCompiler, async () => {
      await runTask(coreCompiler, validated.config, task, sys, flags);
    });
  } catch (e) {
    if (!shouldIgnoreError(e)) {
      const details = `${logger.getLevel() === 'debug' && e instanceof Error ? e.stack : ''}`;
      logger.error(`uncaught cli error: ${e}${details}`);
      return sys.exit(1);
    }
  }
};

/**
 * Run a specified task
 *
 * @param coreCompiler an instance of a minimal, bootstrap compiler for running the specified task
 * @param config a configuration for the Stencil project to apply to the task run
 * @param task the task to run
 * @param sys the {@link d.CompilerSystem} for interacting with the operating system
 * @param flags the parsed CLI flags (owned by CLI, not passed to Core)
 * @public
 * @returns a void promise
 */
export const runTask = async (
  coreCompiler: CoreCompiler,
  config: d.Config,
  task: d.TaskCommand,
  sys: d.CompilerSystem,
  flags?: ConfigFlags,
): Promise<void> => {
  // Ensure we have flags (either passed in or create defaults)
  const resolvedFlags = flags ?? createConfigFlags({ task });

  // Merge CLI flags into config before validation
  const configWithFlags = mergeFlags(config, resolvedFlags);

  if (!configWithFlags.sys) {
    configWithFlags.sys = sys;
  }
  const strictConfig: ValidatedConfig = coreCompiler.validateConfig(configWithFlags, {}).config;

  switch (task) {
    case 'build':
      await taskBuild(coreCompiler, strictConfig);
      break;

    case 'docs':
      await taskDocs(coreCompiler, strictConfig);
      break;

    case 'generate':
    case 'g':
      await taskGenerate(strictConfig);
      break;

    case 'help':
      await taskHelp(resolvedFlags, strictConfig.logger, sys);
      break;

    case 'prerender':
      await taskPrerender(coreCompiler, strictConfig);
      break;

    case 'serve':
      await taskServe(strictConfig);
      break;

    case 'telemetry':
      await taskTelemetry(resolvedFlags, sys, strictConfig.logger);
      break;

    case 'version':
      console.log(coreCompiler.version);
      break;

    default:
      strictConfig.logger.error(
        `${strictConfig.logger.emoji('❌ ')}Invalid stencil command, please see the options below:`,
      );
      await taskHelp(resolvedFlags, strictConfig.logger, sys);
      return configWithFlags.sys.exit(1);
  }
};
