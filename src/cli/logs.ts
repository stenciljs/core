import type { CompilerSystem, Logger, TaskCommand, ValidatedConfig } from '../declarations';
import type { ConfigFlags } from './config-flags';
import type { CoreCompiler } from './load-compiler';

/**
 * Log the name of this package (`@stencil/core`) to an output stream
 *
 * The output stream is determined by the {@link Logger} instance that is provided as an argument to this function
 *
 * The name of the package may not be logged, by design, for certain `task` types and logging levels
 *
 * @param logger the logging entity to use to output the name of the package
 * @param task the current task
 */
export const startupLog = (logger: Logger, task: TaskCommand): void => {
  if (task === 'info' || task === 'serve' || task === 'version') {
    return;
  }

  logger.info(logger.cyan(`@stencil/core`));
};

/**
 * Log this package's version to an output stream
 *
 * The output stream is determined by the {@link Logger} instance that is provided as an argument to this function
 *
 * The package version may not be logged, by design, for certain `task` types and logging levels
 *
 * @param logger the logging entity to use for output
 * @param task the current task
 * @param coreCompiler the compiler instance to derive version information from
 */
export const startupLogVersion = (logger: Logger, task: TaskCommand, coreCompiler: CoreCompiler): void => {
  if (task === 'info' || task === 'serve' || task === 'version') {
    return;
  }
  const isDevBuild = coreCompiler.version.includes('-dev.');

  let startupMsg: string;

  if (isDevBuild) {
    startupMsg = logger.yellow(`[LOCAL DEV] v${coreCompiler.version}`);
  } else {
    startupMsg = logger.cyan(`v${coreCompiler.version}`);
  }
  startupMsg += logger.emoji(' ' + coreCompiler.vermoji);

  logger.info(startupMsg);
};

/**
 * Log details from a {@link CompilerSystem} used by Stencil to an output stream
 *
 * The output stream is determined by the {@link Logger} instance that is provided as an argument to this function
 *
 * @param sys the `CompilerSystem` to report details on
 * @param logger the logging entity to use for output
 * @param flags user set flags for the current invocation of Stencil
 * @param coreCompiler the compiler instance being used for this invocation of Stencil
 */
export const loadedCompilerLog = (
  sys: CompilerSystem,
  logger: Logger,
  flags: ConfigFlags,
  coreCompiler: CoreCompiler,
): void => {
  const sysDetails = sys.details;
  const runtimeInfo = `${sys.name} ${sys.version}`;

  const platformInfo = sysDetails
    ? `${sysDetails.platform}, ${sysDetails.cpuModel}`
    : `Unknown Platform, Unknown CPU Model`;
  const statsInfo = sysDetails
    ? `cpus: ${sys.hardwareConcurrency}, freemem: ${Math.round(
        sysDetails.freemem() / 1000000,
      )}MB, totalmem: ${Math.round(sysDetails.totalmem / 1000000)}MB`
    : 'Unknown CPU Core Count, Unknown Memory';

  if (logger.getLevel() === 'debug') {
    logger.debug(runtimeInfo);
    logger.debug(platformInfo);
    logger.debug(statsInfo);
    logger.debug(`compiler: ${sys.getCompilerExecutingPath()}`);
    logger.debug(`build: ${coreCompiler.buildId}`);
  } else if (flags.ci) {
    logger.info(runtimeInfo);
    logger.info(platformInfo);
    logger.info(statsInfo);
  }
};

/**
 * Log various warnings to an output stream
 *
 * The output stream is determined by the {@link Logger} instance attached to the `config` argument to this function
 *
 * @param coreCompiler the compiler instance being used for this invocation of Stencil
 * @param config a validated configuration object to be used for this run of Stencil
 */
export const startupCompilerLog = (coreCompiler: CoreCompiler, config: ValidatedConfig) => {
  if (config.suppressLogs === true) {
    return;
  }

  const { logger } = config;
  const isDebug = logger.getLevel() === 'debug';
  const isPrerelease = coreCompiler.version.includes('-');
  const isDevBuild = coreCompiler.version.includes('-dev.');

  if (isPrerelease && !isDevBuild) {
    logger.warn(
      logger.yellow(
        `This is a prerelease build, undocumented changes might happen at any time. Technical support is not available for prereleases, but any assistance testing is appreciated.`,
      ),
    );
  }

  if (config.devMode && !isDebug) {
    if (config.buildEs5) {
      logger.warn(
        `Generating ES5 during development is a very task expensive, initial and incremental builds will be much slower. Drop the '--es5' flag and use a modern browser for development.`,
      );
    }

    if (!config.enableCache) {
      logger.warn(`Disabling cache during development will slow down incremental builds.`);
    }
  }
};
