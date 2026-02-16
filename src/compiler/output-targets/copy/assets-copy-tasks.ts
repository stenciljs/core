import { join, normalizePath, relative } from '@utils';
import { dirname } from 'path';

import type * as d from '../../../declarations';

export const getComponentAssetsCopyTasks = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  dest: string,
  collectionsPath: boolean,
) => {
  if (!dest) {
    return [];
  }

  // get a list of all the directories to copy
  // these paths should be absolute
  const copyTasks: Required<d.CopyTask>[] = [];
  const cmps = buildCtx.components;

  cmps
    .filter((cmp) => cmp.assetsDirs != null && cmp.assetsDirs.length > 0)
    .forEach((cmp) => {
      if (!collectionsPath) {
        cmp.assetsDirs.forEach((assetsMeta) => {
          copyTasks.push({
            src: assetsMeta.absolutePath,
            dest: join(dest, assetsMeta.cmpRelativePath),
            warn: false,
            ignore: undefined,
            keepDirStructure: false,
          });
        });
      } else if (!cmp.excludeFromCollection && !cmp.isCollectionDependency) {
        cmp.assetsDirs.forEach((assetsMeta) => {
          const collectionDirDestination = join(dest, relative(config.srcDir, assetsMeta.absolutePath));
          copyTasks.push({
            src: assetsMeta.absolutePath,
            dest: collectionDirDestination,
            warn: false,
            ignore: undefined,
            keepDirStructure: false,
          });
        });
      }
    });

  buildCtx.debug(`getComponentAssetsCopyTasks: ${copyTasks.length}`);

  return copyTasks;
};

export const canSkipAssetsCopy = (
  compilerCtx: d.CompilerCtx,
  entryModules: d.EntryModule[],
  filesChanged: string[],
) => {
  if (!compilerCtx.hasSuccessfulBuild) {
    // always copy assets if we haven't had a successful build yet
    // cannot skip build
    return false;
  }

  // assume we want to skip copying assets again
  let shouldSkipAssetsCopy = true;

  // loop through each of the changed files
  filesChanged.forEach((changedFile) => {
    // get the directory of where the changed file is in
    const changedFileDirPath = normalizePath(dirname(changedFile));

    // loop through all the possible asset directories
    entryModules.forEach((entryModule) => {
      entryModule.cmps.forEach((cmp) => {
        if (cmp.assetsDirs != null) {
          // loop through each of the asset directories of each component
          cmp.assetsDirs.forEach((assetsDir) => {
            // get the absolute of the asset directory
            const assetDirPath = normalizePath(assetsDir.absolutePath);

            // if the changed file directory is this asset directory
            // then we should recopy everything over again
            if (changedFileDirPath === assetDirPath) {
              shouldSkipAssetsCopy = false;
              return;
            }
          });
        }
      });
    });
  });

  return shouldSkipAssetsCopy;
};
