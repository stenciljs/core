import type * as d from '@stencil/core';

import { buildError, isOutputTargetAssets, isOutputTargetWww, join } from '../../utils';
import { getComponentAssetsCopyTasks, canSkipAssetsCopy } from './copy/assets-copy-tasks';

/**
 * Output target generator for component assets.
 *
 * Copies all component `assetsDirs` to:
 * - Unified location (default: `dist/assets/`) for all distribution strategies
 * - www build directories for dev server usage
 *
 * @param config the Stencil configuration
 * @param compilerCtx the compiler context
 * @param buildCtx the build context
 */
export const outputAssets = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const assetsTargets = config.outputTargets.filter(isOutputTargetAssets);
  if (assetsTargets.length === 0) {
    return;
  }

  // Check if any components have assetsDirs
  const hasAssets = buildCtx.components.some(
    (cmp) => cmp.assetsDirs != null && cmp.assetsDirs.length > 0,
  );
  if (!hasAssets) {
    return;
  }

  // Check if we can skip assets copy on rebuilds
  if (
    buildCtx.isRebuild &&
    canSkipAssetsCopy(compilerCtx, buildCtx.entryModules, buildCtx.filesChanged)
  ) {
    return;
  }

  const timespan = buildCtx.createTimeSpan('copy component assets started', true);

  // Get www output targets - we also need to copy assets there for dev server
  const wwwTargets = config.outputTargets.filter(isOutputTargetWww);

  // Collect all copy tasks for all assets targets
  const allCopyTasks: Required<d.CopyTask>[] = [];

  for (const outputTarget of assetsTargets) {
    // Get copy tasks for this assets target's directory (e.g., dist/assets/)
    const copyTasks = getComponentAssetsCopyTasks(config, buildCtx, outputTarget.dir, false);
    allCopyTasks.push(...copyTasks);
  }

  // Also copy assets to www build directories for dev server usage
  for (const wwwTarget of wwwTargets) {
    const wwwAssetsDir = join(wwwTarget.buildDir, 'assets');
    const copyTasks = getComponentAssetsCopyTasks(config, buildCtx, wwwAssetsDir, false);
    allCopyTasks.push(...copyTasks);
  }

  if (allCopyTasks.length > 0) {
    let copiedFiles = 0;
    try {
      const copyResults = await config.sys.copy(allCopyTasks, config.srcDir);
      if (copyResults != null) {
        buildCtx.diagnostics.push(...copyResults.diagnostics);
        compilerCtx.fs.cancelDeleteDirectoriesFromDisk(copyResults.dirPaths);
        compilerCtx.fs.cancelDeleteFilesFromDisk(copyResults.filePaths);
        copiedFiles = copyResults.filePaths.length;
      }
    } catch (e) {
      const err = buildError(buildCtx.diagnostics);
      if (e instanceof Error) {
        err.messageText = e.message;
      }
    }
    timespan.finish(
      `copy component assets finished (${copiedFiles} file${copiedFiles === 1 ? '' : 's'})`,
    );
  } else {
    timespan.finish('copy component assets finished (no assets)');
  }
};
