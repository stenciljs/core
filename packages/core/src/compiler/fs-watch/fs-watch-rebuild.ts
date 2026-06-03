import { basename } from 'path';
import type * as d from '@stencil/core';

import {
  getComponentsDtsSrcFilePath,
  isOutputTargetDocsJson,
  isOutputTargetDocsVscode,
  isOutputTargetStats,
  isString,
  STYLE_EXT,
  unique,
} from '../../utils';

export const filesChanged = (buildCtx: d.BuildCtx) => {
  // files changed include updated, added and deleted
  return unique([
    ...buildCtx.filesUpdated,
    ...buildCtx.filesAdded,
    ...buildCtx.filesDeleted,
  ]).sort();
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
const hasScriptExt = (filePath: string): boolean => {
  const ext = getExt(filePath);

  return ext ? SCRIPT_EXT.includes(ext) : false;
};

/**
 * Helper to check if a filepath has a style extension
 *
 * @param filePath a file extension to check
 * @returns whether the filepath has a style extension or not
 */
const hasStyleExt = (filePath: string): boolean => {
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
export const hasScriptChanges = (buildCtx: d.BuildCtx): boolean =>
  buildCtx.filesChanged.some(hasScriptExt);

/**
 * Check whether a build has style changes
 *
 * @param buildCtx the build context
 * @returns whether or not there are style changes
 */
export const hasStyleChanges = (buildCtx: d.BuildCtx): boolean =>
  buildCtx.filesChanged.some(hasStyleExt);

/**
 * Returns true if any HTML file under `srcDir` changed.
 * HTML outside srcDir (e.g. test fixtures) has no effect on compiled output.
 * @param config the Stencil configuration
 * @param buildCtx the current build context
 * @returns whether or not there are HTML changes under srcDir
 */
export const hasHtmlChanges = (config: d.ValidatedConfig, buildCtx: d.BuildCtx): boolean => {
  const srcDirPrefix = config.srcDir + '/';

  const isHtmlOrUsageMd = (f: string) => {
    if (!f.startsWith(srcDirPrefix)) return false;
    const lower = f.toLowerCase();
    return lower.endsWith('.html') || (lower.endsWith('.md') && f.includes('/usage/'));
  };

  if (buildCtx.filesChanged.some(isHtmlOrUsageMd)) return true;
  if (buildCtx.filesDeleted.some(isHtmlOrUsageMd)) return true;

  // Deleting a usage/ directory fires dirDelete, not individual fileDelete events
  const isUsageDir = (d: string) => d.startsWith(srcDirPrefix) && /\/usage\/?$/.test(d);
  if (buildCtx.dirsDeleted.some(isUsageDir)) return true;

  // Adding or removing a component file changes the set of renderable components
  const isSrcTsx = (f: string) => f.startsWith(srcDirPrefix) && f.toLowerCase().endsWith('.tsx');
  return buildCtx.filesAdded.some(isSrcTsx) || buildCtx.filesDeleted.some(isSrcTsx);
};

/**
 * Checks if a path is ignored by the watch configuration
 *
 * @param config The validated config for the Stencil project
 * @param path The path to check
 * @returns Whether the path is ignored by the watch configuration
 */
export const isWatchIgnorePath = (config: d.ValidatedConfig, path: string) => {
  if (!isString(path)) {
    return false;
  }

  const isWatchIgnore = (config.watchIgnoredRegex as RegExp[]).some((reg) => reg.test(path));
  if (isWatchIgnore) {
    return true;
  }
  const outputTargets = config.outputTargets;
  const ignoreFiles = [
    // Ignore components.d.ts - its disk write would cascade-rebuild all components.
    getComponentsDtsSrcFilePath(config),
    ...outputTargets.filter(isOutputTargetDocsJson).map((o) => o.file),
    ...outputTargets.filter(isOutputTargetDocsJson).map((o) => o.typesFile),
    ...outputTargets.filter(isOutputTargetStats).map((o) => o.file),
    ...outputTargets.filter(isOutputTargetDocsVscode).map((o) => o.file),
  ];
  if (ignoreFiles.includes(path)) {
    return true;
  }

  return false;
};
