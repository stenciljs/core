import { buildError, isGlob, isOutputTargetCopy, join, normalizePath } from '@utils';
import { minimatch } from 'minimatch';

import type * as d from '../../../declarations';
import { canSkipAssetsCopy, getComponentAssetsCopyTasks } from './assets-copy-tasks';
import { getDestAbsPath, getSrcAbsPath } from './local-copy-tasks';

const DEFAULT_IGNORE = [
  '**/__mocks__/**',
  '**/__fixtures__/**',
  '**/dist/**',
  '**/.{idea,git,cache,output,temp}/**',
  '**/.ds_store',
  '**/.gitignore',
  '**/desktop.ini',
  '**/thumbs.db',
];

export const outputCopy = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  const outputTargets = config.outputTargets.filter(isOutputTargetCopy);
  if (outputTargets.length === 0) {
    return;
  }

  const changedFiles = [...buildCtx.filesUpdated, ...buildCtx.filesAdded, ...buildCtx.dirsAdded];
  const copyTasks: Required<d.CopyTask>[] = [];
  const needsCopyAssets = !canSkipAssetsCopy(compilerCtx, buildCtx.entryModules, buildCtx.filesChanged);
  outputTargets.forEach((o) => {
    if (needsCopyAssets && o.copyAssets) {
      copyTasks.push(...getComponentAssetsCopyTasks(config, buildCtx, o.dir, o.copyAssets === 'collection'));
    }
    copyTasks.push(...getCopyTasks(config, buildCtx, o, changedFiles));
  });

  if (copyTasks.length > 0) {
    const timespan = buildCtx.createTimeSpan(`copy started`);
    let copiedFiles = 0;
    try {
      const copyResults = await config.sys.copy(copyTasks, config.srcDir);
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
    timespan.finish(`copy finished (${copiedFiles} file${copiedFiles === 1 ? '' : 's'})`);
  }
};

const getCopyTasks = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  o: d.OutputTargetCopy,
  changedFiles: string[],
) => {
  if (!Array.isArray(o.copy)) {
    return [];
  }
  const copyTasks =
    !buildCtx.isRebuild || buildCtx.requiresFullBuild ? o.copy : filterCopyTasks(config, o.copy, changedFiles);

  return copyTasks.map((t) => transformToAbs(t, o.dir));
};

const filterCopyTasks = (config: d.ValidatedConfig, tasks: d.CopyTask[], changedFiles: string[]) => {
  if (Array.isArray(tasks)) {
    return tasks.filter((copy) => {
      let copySrc = copy.src;
      if (isGlob(copySrc)) {
        // test the glob
        copySrc = join(config.srcDir, copySrc);
        if (changedFiles.some(minimatch.filter(copySrc))) {
          return true;
        }
      } else {
        copySrc = normalizePath(getSrcAbsPath(config, copySrc + '/'));
        if (changedFiles.some((f) => f.startsWith(copySrc))) {
          return true;
        }
      }
      return false;
    });
  }
  return [];
};

const transformToAbs = (copyTask: d.CopyTask, dest: string): Required<d.CopyTask> => {
  return {
    src: copyTask.src,
    dest: getDestAbsPath(copyTask.src, dest, copyTask.dest),
    ignore: copyTask.ignore || DEFAULT_IGNORE,
    keepDirStructure:
      typeof copyTask.keepDirStructure === 'boolean' ? copyTask.keepDirStructure : copyTask.dest == null,
    warn: copyTask.warn !== false,
  };
};
