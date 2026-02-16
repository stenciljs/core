import { isFunction, isRemoteUrl, relative } from '@utils';

import type * as d from '../../declarations';
import { generateBuildResults } from './build-results';
import { generateBuildStats, writeBuildStats } from './build-stats';

/**
 * Finish a build as having completed successfully
 * @param buildCtx the build context for the build being aborted
 * @returns the build results
 */
export const buildFinish = async (buildCtx: d.BuildCtx): Promise<d.CompilerBuildResults> => {
  const results = await buildDone(buildCtx.config, buildCtx.compilerCtx, buildCtx, false);

  const buildLog: d.BuildLog = {
    buildId: buildCtx.buildId,
    messages: buildCtx.buildMessages.slice(),
    progress: 1,
  };

  buildCtx.compilerCtx.events.emit('buildLog', buildLog);

  return results;
};

/**
 * Finish a build early due to failure. During the build process, a fatal error has occurred where the compiler cannot
 * continue further
 * @param buildCtx the build context for the build being aborted
 * @returns the build results
 */
export const buildAbort = (buildCtx: d.BuildCtx): Promise<d.CompilerBuildResults> => {
  return buildDone(buildCtx.config, buildCtx.compilerCtx, buildCtx, true);
};

/**
 * Mark a build as done
 * @param config the Stencil configuration used for the build
 * @param compilerCtx the compiler context associated with the build
 * @param buildCtx the build context associated with the build to mark as done
 * @param aborted true if the build ended early due to failure, false otherwise
 * @returns the build results
 */
const buildDone = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  aborted: boolean,
): Promise<d.CompilerBuildResults> => {
  if (buildCtx.hasFinished && buildCtx.buildResults) {
    // we've already marked this build as finished and
    // already created the build results, just return these
    return buildCtx.buildResults;
  }

  // create the build results data
  buildCtx.buildResults = generateBuildResults(config, compilerCtx, buildCtx);

  // After the build results are available on the buildCtx, call the stats and set it.
  // We will use this later to write the files.
  buildCtx.buildStats = generateBuildStats(config, buildCtx);

  await writeBuildStats(config, buildCtx.buildStats);

  buildCtx.debug(`${aborted ? 'aborted' : 'finished'} build, ${buildCtx.buildResults.duration}ms`);

  // log any errors/warnings
  if (!buildCtx.hasFinished) {
    // haven't set this build as finished yet
    if (!buildCtx.hasPrintedResults) {
      cleanDiagnosticsRelativePath(config, buildCtx.buildResults.diagnostics);
      config.logger.printDiagnostics(buildCtx.buildResults.diagnostics);
    }

    const hasChanges = buildCtx.hasScriptChanges || buildCtx.hasStyleChanges;
    if (buildCtx.isRebuild && hasChanges && buildCtx.buildResults.hmr && !aborted) {
      // this is a rebuild, and we've got hmr data
      // and this build hasn't been aborted
      logHmr(config.logger, buildCtx.buildResults.hmr);
    }

    // create a nice pretty message stating what happened
    const buildText = buildCtx.isRebuild ? 'rebuild' : 'build';
    const watchText = config.watch ? ', watching for changes...' : '';
    let buildStatus = 'finished';
    let statusColor = 'green';

    if (buildCtx.hasError) {
      // gosh darn, build had errors
      // ಥ_ಥ
      buildStatus = 'failed';
      statusColor = 'red';
    } else {
      // successful build!
      // ┏(°.°)┛ ┗(°.°)┓ ┗(°.°)┛ ┏(°.°)┓
      compilerCtx.changedFiles.clear();
      compilerCtx.hasSuccessfulBuild = true;
      buildCtx.buildResults.hasSuccessfulBuild = true;
    }

    // print out the time it took to build
    // and add the duration to the build results
    if (!buildCtx.hasPrintedResults) {
      buildCtx.timeSpan.finish(`${buildText} ${buildStatus}${watchText}`, statusColor, true, true);
      buildCtx.hasPrintedResults = true;
    }

    // emit a buildFinish event for anyone who cares
    compilerCtx.events.emit('buildFinish', buildCtx.buildResults);

    // write all of our logs to disk if config'd to do so
    // do this even if there are errors or not the active build
    if (isFunction(config.logger.writeLogs)) {
      config.logger.writeLogs(buildCtx.isRebuild);
    }
  }

  // it's official, this build has finished
  buildCtx.hasFinished = true;

  if (!config.watch) {
    compilerCtx.reset();
    if (global.gc) {
      buildCtx.debug(`triggering forced gc`);
      global.gc();
      buildCtx.debug(`forced gc finished`);
    }
  }

  return buildCtx.buildResults;
};

/**
 * In a Hot Module Replacement (HMR) context, log what changed between builds
 * @param logger the instance of the logger to report what's changed
 * @param hmr the HMR data, which includes what's changed between builds
 */
const logHmr = (logger: d.Logger, hmr: d.HotModuleReplacement): void => {
  if (hmr.componentsUpdated) {
    cleanupUpdateMsg(logger, `updated component`, hmr.componentsUpdated);
  }

  if (hmr.inlineStylesUpdated) {
    const inlineStyles = hmr.inlineStylesUpdated
      .map((s) => s.styleTag)
      .reduce((arr, v) => {
        if (!arr.includes(v)) {
          arr.push(v);
        }
        return arr;
      }, [] as string[]);
    cleanupUpdateMsg(logger, `updated style`, inlineStyles);
  }

  if (hmr.externalStylesUpdated) {
    cleanupUpdateMsg(logger, `updated stylesheet`, hmr.externalStylesUpdated);
  }

  if (hmr.imagesUpdated) {
    cleanupUpdateMsg(logger, `updated image`, hmr.imagesUpdated);
  }
};

const cleanupUpdateMsg = (logger: d.Logger, msg: string, fileNames: string[]) => {
  if (fileNames.length > 0) {
    let fileMsg = '';

    if (fileNames.length > 7) {
      const remaining = fileNames.length - 6;
      fileNames = fileNames.slice(0, 6);
      fileMsg = fileNames.join(', ') + `, +${remaining} others`;
    } else {
      fileMsg = fileNames.join(', ');
    }

    if (fileNames.length > 1) {
      msg += 's';
    }

    logger.info(`${msg}: ${logger.cyan(fileMsg)}`);
  }
};

/**
 * Update the relative file path for diagnostics. The updates are done in place.
 * @param config the Stencil configuration associated with the current build
 * @param diagnostics the diagnostics to update
 */
const cleanDiagnosticsRelativePath = (config: d.Config, diagnostics: ReadonlyArray<d.Diagnostic>): void => {
  diagnostics.forEach((diagnostic) => {
    if (!diagnostic.relFilePath && diagnostic.absFilePath && !isRemoteUrl(diagnostic.absFilePath) && config.rootDir) {
      diagnostic.relFilePath = relative(config.rootDir, diagnostic.absFilePath);
    }
  });
};
