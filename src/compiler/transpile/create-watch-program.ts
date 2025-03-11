import ts from 'typescript';

import type * as d from '../../declarations';
import { getTsOptionsToExtend } from './ts-config';

/**
 * This method creates the {@link ts.EmitAndSemanticDiagnosticsBuilderProgram} that is responsible for
 * rebuilding a Stencil project after file changes have been detected (via TS's polling-based file watcher).
 *
 * We mostly use a traditional approach to create the program as documented by the TS team:
 * {@link https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#writing-an-incremental-program-watcher}
 * However, we do override a few methods on the {@link ts.System} object.
 *
 * @param config The validated config for the Stencil project.
 * @param buildCallback A function that will be executed after the TS program is created and on subsequent
 * project rebuilds.
 * @returns An object containing the {@link ts.EmitAndSemanticDiagnosticsBuilderProgram} and callback
 * function to trigger a project rebuild.
 */
export const createTsWatchProgram = async (
  config: d.ValidatedConfig,
  buildCallback: (tsBuilder: ts.BuilderProgram) => Promise<void>,
) => {
  let isRunning = false;
  let lastTsBuilder: any;
  let timeoutId: any;

  // Get the pre-baked TS options we want to use for our builder program
  const optionsToExtend = getTsOptionsToExtend(config);

  const tsWatchSys: ts.System = {
    ...ts.sys,

    /**
     * Override the default `setTimeout` implementation in the {@link ts.System}. The reasoning
     * behind this change is not explicitly clear, but this appears to be related to debouncing
     * the build processes. Stencil currently has an issue where multiple file changes are detected
     * at the same time for a single change. So, this override appears to prevent us from actually rebuilding
     * the project in rapid succession for the detected changes.
     *
     * @param callback A method that will execute after the specified time duration
     * @param time The time to wait before executing the callback
     * @returns A {@link NodeJs.Timer} instance
     */
    setTimeout(callback, time) {
      clearTimeout(timeoutId);
      const delay = config.sys.watchTimeout || time;
      const tick = () => {
        if (!isRunning) {
          callback();
          timeoutId = null;
        } else {
          timeoutId = setTimeout(tick, delay);
        }
      }
      timeoutId = setTimeout(tick, delay);
      return timeoutId;
    },
  };

  // Whenever the system teardown happens, we need to make sure there is no timeout running
  config.sys.addDestroy(() => tsWatchSys.clearTimeout(timeoutId));

  // Use the TS API to create our own watch compiler host that will be
  // used to instantiate our watch program
  const tsWatchHost = ts.createWatchCompilerHost(
    // Use the TS config from the Stencil project
    config.tsconfig,
    optionsToExtend,
    tsWatchSys,
    // We use the `createEmitAndSemanticDiagnosticsBuilderProgram` as opposed to the
    // `createSemanticDiagnosticsBuilderProgram` because we need our program to emit
    // output files in addition to checking for errors
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    // Add a callback to log out diagnostics as the program runs
    (reportDiagnostic) => {
      config.logger.debug('watch reportDiagnostic:' + reportDiagnostic.messageText);
    },
    // Add a callback to log out statuses of the the watch program
    (reportWatchStatus) => {
      config.logger.debug(reportWatchStatus.messageText);
    },
    // We don't want to allow users to mess with the watch method, so
    // we only strip out the excludeFiles and excludeDirectories properties
    // to allow the user to still have control over which files get excluded from the watcher
    config.tsWatchOptions
      ? {
          excludeFiles: config.tsWatchOptions.excludeFiles,
          excludeDirectories: config.tsWatchOptions.excludeDirectories,
        }
      : undefined,
  );

  // Add a callback that will execute whenever a new instance
  // is created using the definition we have constructed for `tsWatchHost`.
  // This is what will be used to kick-off the actual Stencil build process via the `buildCallback()`
  tsWatchHost.afterProgramCreate = async (tsBuilder) => {
    lastTsBuilder = tsBuilder;
    isRunning = true;
    await buildCallback(tsBuilder);
    isRunning = false;
  };

  return {
    // Create the watch builder program instance and make it available on the
    // returned object. This provides us an easy way to teardown the program
    // down-the-road.
    program: ts.createWatchProgram(tsWatchHost),
    // This will be called via a callback on the watch build whenever a file
    // change is detected
    rebuild: () => {
      if (lastTsBuilder) {
        tsWatchSys.setTimeout(() => tsWatchHost.afterProgramCreate(lastTsBuilder), 300);
      }
    },
  };
};
