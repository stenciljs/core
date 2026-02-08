import { isGlob, isOutputTargetWww, normalizePath, sortBy } from '@utils';
import { minimatch } from 'minimatch';
import { basename } from 'path';

import type * as d from '../../declarations';
import { getScopeId } from '../style/scope-css';

export const generateHmr = (config: d.Config, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  if (config.devServer?.reloadStrategy == null) {
    return null;
  }

  const hmr: d.HotModuleReplacement = {
    reloadStrategy: config.devServer.reloadStrategy,
    versionId: Date.now().toString().substring(6) + '' + Math.round(Math.random() * 89999 + 10000),
  };

  if (buildCtx.scriptsAdded.length > 0) {
    hmr.scriptsAdded = buildCtx.scriptsAdded.slice();
  }

  if (buildCtx.scriptsDeleted.length > 0) {
    hmr.scriptsDeleted = buildCtx.scriptsDeleted.slice();
  }

  const excludeHmr = excludeHmrFiles(config, config.devServer.excludeHmr, buildCtx.filesChanged);
  if (excludeHmr.length > 0) {
    hmr.excludeHmr = excludeHmr.slice();
  }

  if (buildCtx.hasHtmlChanges) {
    hmr.indexHtmlUpdated = true;
  }

  if (buildCtx.hasServiceWorkerChanges) {
    hmr.serviceWorkerUpdated = true;
  }

  const outputTargetsWww = config.outputTargets.filter(isOutputTargetWww);

  const componentsUpdated = getComponentsUpdated(compilerCtx, buildCtx);
  if (componentsUpdated) {
    hmr.componentsUpdated = componentsUpdated;
  }

  if (Object.keys(buildCtx.stylesUpdated).length > 0) {
    hmr.inlineStylesUpdated = sortBy(
      buildCtx.stylesUpdated.map((s) => {
        return {
          styleId: getScopeId(s.styleTag, s.styleMode),
          styleTag: s.styleTag,
          styleText: s.styleText,
        } as d.HmrStyleUpdate;
      }),
      (s) => s.styleId,
    );
  }

  const externalStylesUpdated = getExternalStylesUpdated(buildCtx, outputTargetsWww);
  if (externalStylesUpdated) {
    hmr.externalStylesUpdated = externalStylesUpdated;
  }

  const externalImagesUpdated = getImagesUpdated(buildCtx, outputTargetsWww);
  if (externalImagesUpdated) {
    hmr.imagesUpdated = externalImagesUpdated;
  }

  return hmr;
};

const getComponentsUpdated = (compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  // find all of the components that would be affected from the file changes
  if (!buildCtx.filesChanged) {
    return null;
  }

  const filesToLookForImporters = buildCtx.filesChanged.filter((f) => {
    return f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx');
  });

  if (filesToLookForImporters.length === 0) {
    return null;
  }

  const changedScriptFiles: string[] = [];
  const checkedFiles = new Set<string>();
  const allModuleFiles = buildCtx.moduleFiles.filter((m) => m.localImports && m.localImports.length > 0);

  while (filesToLookForImporters.length > 0) {
    const scriptFile = filesToLookForImporters.shift();
    addTsFileImporters(allModuleFiles, filesToLookForImporters, checkedFiles, changedScriptFiles, scriptFile);
  }

  const tags = changedScriptFiles.reduce((tags, changedTsFile) => {
    const moduleFile = compilerCtx.moduleMap.get(changedTsFile);
    if (moduleFile != null) {
      moduleFile.cmps.forEach((cmp) => {
        if (typeof cmp.tagName === 'string') {
          if (!tags.includes(cmp.tagName)) {
            tags.push(cmp.tagName);
          }
        }
      });
    }
    return tags;
  }, [] as string[]);

  if (tags.length === 0) {
    return null;
  }

  return tags.sort();
};

const addTsFileImporters = (
  allModuleFiles: d.Module[],
  filesToLookForImporters: string[],
  checkedFiles: Set<string>,
  changedScriptFiles: string[],
  scriptFile: string,
) => {
  if (!changedScriptFiles.includes(scriptFile)) {
    // add it to our list of files to transpile
    changedScriptFiles.push(scriptFile);
  }

  if (checkedFiles.has(scriptFile)) {
    // already checked this file
    return;
  }
  checkedFiles.add(scriptFile);

  // get all the ts files that import this ts file
  const tsFilesThatImportsThisTsFile = allModuleFiles.reduce((arr, moduleFile) => {
    moduleFile.localImports.forEach((localImport) => {
      let checkFile = localImport;

      if (checkFile === scriptFile) {
        arr.push(moduleFile.sourceFilePath);
        return;
      }

      checkFile = localImport + '.tsx';
      if (checkFile === scriptFile) {
        arr.push(moduleFile.sourceFilePath);
        return;
      }

      checkFile = localImport + '.ts';
      if (checkFile === scriptFile) {
        arr.push(moduleFile.sourceFilePath);
        return;
      }

      checkFile = localImport + '.js';
      if (checkFile === scriptFile) {
        arr.push(moduleFile.sourceFilePath);
        return;
      }
    });
    return arr;
  }, [] as string[]);

  // add all the files that import this ts file to the list of ts files we need to look through
  tsFilesThatImportsThisTsFile.forEach((tsFileThatImportsThisTsFile) => {
    // if we add to this array, then the while look will keep working until it's empty
    filesToLookForImporters.push(tsFileThatImportsThisTsFile);
  });
};

const getExternalStylesUpdated = (buildCtx: d.BuildCtx, outputTargetsWww: d.OutputTargetWww[]) => {
  if (!buildCtx.isRebuild || outputTargetsWww.length === 0) {
    return null;
  }

  const cssFiles = buildCtx.filesWritten.filter((f) => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    return null;
  }

  return cssFiles.map((cssFile) => basename(cssFile)).sort();
};

const getImagesUpdated = (buildCtx: d.BuildCtx, outputTargetsWww: d.OutputTargetWww[]) => {
  if (outputTargetsWww.length === 0) {
    return null;
  }

  const imageFiles = buildCtx.filesChanged.reduce((arr, filePath) => {
    if (IMAGE_EXT.some((ext) => filePath.toLowerCase().endsWith(ext))) {
      const fileName = basename(filePath);
      if (!arr.includes(fileName)) {
        arr.push(fileName);
      }
    }
    return arr;
  }, []);

  if (imageFiles.length === 0) {
    return null;
  }

  return imageFiles.sort();
};

/**
 * Determine a list of files (if any) which should be excluded from HMR updates.
 *
 * @param config a user-supplied config
 * @param excludeHmr a list of glob patterns that should be used to determine
 * whether to exclude a file or not (a file will be excluded if it matches one
 * @param filesChanged an array of files which are changed in the HMR update
 * currently under consideration
 * @returns a sorted list of files to exclude
 */
const excludeHmrFiles = (config: d.Config, excludeHmr: string[], filesChanged: string[]): string[] => {
  const excludeFiles: string[] = [];

  if (!excludeHmr || excludeHmr.length === 0) {
    return excludeFiles;
  }

  excludeHmr.forEach((excludeHmr) => {
    return filesChanged
      .map((fileChanged) => {
        let shouldExclude = false;

        if (isGlob(excludeHmr)) {
          shouldExclude = minimatch(fileChanged, excludeHmr);
        } else {
          shouldExclude = normalizePath(excludeHmr) === normalizePath(fileChanged);
        }

        if (shouldExclude) {
          config.logger.debug(`excludeHmr: ${fileChanged}`);
          excludeFiles.push(basename(fileChanged));
        }

        return shouldExclude;
      })
      .some((r) => r);
  });

  return excludeFiles.sort();
};

const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg'];
