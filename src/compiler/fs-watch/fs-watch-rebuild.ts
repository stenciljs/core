import { isOutputTargetDocsJson, isOutputTargetDocsVscode, isOutputTargetStats, isString, unique } from '@utils';
import { basename } from 'path';

import type * as d from '../../declarations';

export const filesChanged = (buildCtx: d.BuildCtx) => {
  // files changed include updated, added and deleted
  return unique([...buildCtx.filesUpdated, ...buildCtx.filesAdded, ...buildCtx.filesDeleted]).sort();
};

/**
 * Unary helper function mapping string to string and wrapping `basename`,
 * which normally takes two string arguments. This means it cannot be passed
 * to `Array.prototype.map`, but this little helper can!
 *
 * @param filePath a filepath to check out
 * @returns the basename for that filepath
 */
const unaryBasename = (filePath: string): string => basename(filePath);

/**
 * Get the file extension for a path
 *
 * @param filePath a path
 * @returns the file extension (well, characters after the last `'.'`) or
 * `null` if no extension exists.
 */
const getExt = (filePath: string): string | null => {
  const fileParts = filePath.split('.');

  return fileParts.length > 1 ? fileParts.pop()!.toLowerCase() : null;
};

/**
 * Script extensions which we want to be able to recognize
 */
const SCRIPT_EXT = ['ts', 'tsx', 'js', 'jsx'];

/**
 * Helper to check if a filepath has a script extension
 *
 * @param filePath a file extension
 * @returns whether the filepath has a script extension or not
 */
export const hasScriptExt = (filePath: string): boolean => {
  const ext = getExt(filePath);

  return ext ? SCRIPT_EXT.includes(ext) : false;
};

const STYLE_EXT = ['css', 'scss', 'sass', 'pcss', 'styl', 'stylus', 'less'];

/**
 * Helper to check if a filepath has a style extension
 *
 * @param filePath a file extension to check
 * @returns whether the filepath has a style extension or not
 */
export const hasStyleExt = (filePath: string): boolean => {
  const ext = getExt(filePath);

  return ext ? STYLE_EXT.includes(ext) : false;
};

/**
 * Get all scripts from a build context that were added
 *
 * @param buildCtx the build context
 * @returns an array of filepaths that were added
 */
export const scriptsAdded = (buildCtx: d.BuildCtx): string[] =>
  buildCtx.filesAdded.filter(hasScriptExt).map(unaryBasename);

/**
 * Get all scripts from a build context that were deleted
 *
 * @param buildCtx the build context
 * @returns an array of deleted filepaths
 */
export const scriptsDeleted = (buildCtx: d.BuildCtx): string[] =>
  buildCtx.filesDeleted.filter(hasScriptExt).map(unaryBasename);

/**
 * Check whether a build has script changes
 *
 * @param buildCtx the build context
 * @returns whether or not there are script changes
 */
export const hasScriptChanges = (buildCtx: d.BuildCtx): boolean => buildCtx.filesChanged.some(hasScriptExt);

/**
 * Check whether a build has style changes
 *
 * @param buildCtx the build context
 * @returns whether or not there are style changes
 */
export const hasStyleChanges = (buildCtx: d.BuildCtx): boolean => buildCtx.filesChanged.some(hasStyleExt);

/**
 * Check whether a build has html changes
 *
 * @param config the current config
 * @param buildCtx the build context
 * @returns whether or not HTML files were changed
 */
export const hasHtmlChanges = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): boolean => {
  const anyHtmlChanged = buildCtx.filesChanged.some((f) => f.toLowerCase().endsWith('.html'));

  if (anyHtmlChanged) {
    // any *.html in any directory that changes counts and rebuilds
    return true;
  }

  const srcIndexHtmlChanged = buildCtx.filesChanged.some((fileChanged) => {
    // the src index index.html file has changed
    // this file name could be something other than index.html
    return fileChanged === config.srcIndexHtml;
  });

  return srcIndexHtmlChanged;
};

export const updateCacheFromRebuild = (compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  buildCtx.filesChanged.forEach((filePath) => {
    compilerCtx.fs.clearFileCache(filePath);
  });

  buildCtx.dirsAdded.forEach((dirAdded) => {
    compilerCtx.fs.clearDirCache(dirAdded);
  });

  buildCtx.dirsDeleted.forEach((dirDeleted) => {
    compilerCtx.fs.clearDirCache(dirDeleted);
  });
};

export const isWatchIgnorePath = (config: d.ValidatedConfig, path: string) => {
  if (isString(path)) {
    const isWatchIgnore = (config.watchIgnoredRegex as RegExp[]).some((reg) => reg.test(path));
    if (isWatchIgnore) {
      return true;
    }
    const outputTargets = config.outputTargets;
    const ignoreFiles = [
      ...outputTargets.filter(isOutputTargetDocsJson).map((o) => o.file),
      ...outputTargets.filter(isOutputTargetDocsJson).map((o) => o.typesFile),
      ...outputTargets.filter(isOutputTargetStats).map((o) => o.file),
      ...outputTargets.filter(isOutputTargetDocsVscode).map((o) => o.file),
    ];
    if (ignoreFiles.includes(path)) {
      return true;
    }
  }
  return false;
};
