import ts from 'typescript';

import type * as d from '../../declarations';
import { getTsOptionsToExtend } from './ts-config';

/**
 * Create a TypeScript Program ({@link ts.Program}) to perform builds of a Stencil project using the provided
 * `buildCallback` entity
 * @param config a Stencil configuration to apply to a full build of a Stencil project
 * @param buildCallback a callback that invokes the actual transpilation of a Stencil project
 * @returns a Program that marries the TypeScript and Stencil compilers together.
 */
export const createTsBuildProgram = async (
  config: d.ValidatedConfig,
  buildCallback: (tsBuilder: ts.BuilderProgram) => Promise<void>,
): Promise<ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>> => {
  let isBuildRunning = false;
  let currentBuildTimeoutId: any;

  const optionsToExtend = getTsOptionsToExtend(config);

  /**
   * Create a {@link ts.System}. The System is responsible for handling all interactions between the TypeScript compiler
   * and the host operating system.
   */
  const tsWatchSys: ts.System = {
    ...ts.sys,

    /**
     * Watch changes in source files, missing files needed to update the program or config file
     * @returns a no-op file watcher
     */
    watchFile(): ts.FileWatcher {
      return {
        close() {},
      };
    },
    /**
     * Watch a resolved module's failed lookup locations, config file specs, type roots where auto type reference
     * directives are added
     * @returns a no-op file watcher
     */
    watchDirectory(): ts.FileWatcher {
      return {
        close() {},
      };
    },
    /**
     * Set delayed compilation, so that multiple changes in short span are compiled together
     * @param callback a callback to invoke upon the completion of compilation. this function is provided to Stencil by
     * the TypeScript compiler.
     * @param timeoutMs the minimum time to wait (in milliseconds) before checking if compilation is complete or not
     * @returns the identifier for the interval that's created
     */
    setTimeout(callback: (...args: any[]) => void, timeoutMs: number): any {
      currentBuildTimeoutId = setInterval(() => {
        if (!isBuildRunning) {
          callback();
          clearInterval(currentBuildTimeoutId);
        }
      }, config.sys.watchTimeout || timeoutMs);
      return currentBuildTimeoutId;
    },

    /**
     * Reset existing delayed compilation
     * @param timeoutId the current build timeout identifier to clear
     */
    clearTimeout(timeoutId: any): void {
      clearInterval(timeoutId);
    },
  };

  config.sys.addDestroy(() => tsWatchSys.clearTimeout(currentBuildTimeoutId));

  /**
   * Create a {@link ts.WatchCompilerHost}. A CompilerHost allows a {@link ts.Program} to interact with the
   * {@link ts.System}, by acting as an intermediary:
   * ```
   * ┌────────────┐   ┌──────────────────────┐   ┌───────────┐   ┌──────────────────┐
   * │ ts.Program │<->│ ts.WatchCompilerHost │<->│ ts.System │<->│ Operating System │
   * └────────────┘   └──────────────────────┘   └───────────┘   └──────────────────┘
   * ```
   *
   * Strictly speaking, the created entity is a subclass of a WatchCompilerHost. The
   * {@link ts.WatchCompilerHostOfConfigFile} class has the following features that makes it useful to Stencil (even
   * when Stencil is performing a single, full build):
   * - it provides the opportunity to extend/alter an existing tsconfig file, allowing users to override specific
   * configuration options via {@link ts.WatchCompilerHostOfConfigFile#optionsToExtend}, which is a provided as an
   * argument in the constructor
   * - it includes the {@link ts.WatchCompilerHost#afterProgramCreate} function in its interface, which Stencil
   * overrides to invoke a build callback (not as a part of this object's creation)
   */
  const tsWatchHost: ts.WatchCompilerHostOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram> =
    ts.createWatchCompilerHost(
      config.tsconfig,
      optionsToExtend,
      tsWatchSys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      (reportDiagnostic) => {
        config.logger.debug('watch reportDiagnostic:' + reportDiagnostic.messageText);
      },
      (reportWatchStatus) => {
        config.logger.debug(reportWatchStatus.messageText);
      },
    );

  /**
   * Override {@link ts.WatchCompilerHost#afterProgramCreate} to invoke the build callback that was provided as an
   * argument to this function.
   * @param tsBuilder a {@link ts.BuilderProgram} to manage the {@link ts.Program} in the provided build context
   */
  tsWatchHost.afterProgramCreate = async (tsBuilder: ts.EmitAndSemanticDiagnosticsBuilderProgram): Promise<void> => {
    isBuildRunning = true;
    await buildCallback(tsBuilder);
    isBuildRunning = false;
  };

  /**
   * Create the initial {@link ts.Program} using Stencil's custom {@link ts.WatchCompilerHostOfConfigFile}. The Program
   * represents the _TypeScript_ compiler context, that will work in tandem with Stencil's compiler context and build
   * context
   */
  return ts.createWatchProgram(tsWatchHost);
};
