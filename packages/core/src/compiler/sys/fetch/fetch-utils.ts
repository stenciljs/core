import { isTsFile, isTsxFile, normalizePath } from '../../../utils';
import { isCommonDirModuleFile } from '../resolve/resolve-utils';

export const packageVersions = new Map<string, string>();
export const known404Urls = new Set<string>();

/**
 * Get the URL for a Stencil module given the path to the compiler
 *
 * @param compilerExe the path to the compiler executable
 * @param path the path to the module or file in question
 * @returns a URL for the file of interest
 */
export const getStencilModuleUrl = (compilerExe: string, path: string): string => {
  path = normalizePath(path);
  let parts = path.split('/');
  const nmIndex = parts.lastIndexOf('node_modules');
  if (nmIndex > -1 && nmIndex < parts.length - 1) {
    parts = parts.slice(nmIndex + 1);
    if (parts[0].startsWith('@')) {
      parts = parts.slice(2);
    } else {
      parts = parts.slice(1);
    }
    path = parts.join('/');
  }
  const stencilRootUrl = new URL('../', compilerExe).href;
  return new URL('./' + path, stencilRootUrl).href;
};

export const skipFilePathFetch = (filePath: string) => {
  if (isTsFile(filePath) || isTsxFile(filePath)) {
    // don't bother trying to resolve  node_module packages w/ typescript files
    // they should already be .js files
    return true;
  }

  const pathParts = filePath.split('/');
  const secondToLast = pathParts[pathParts.length - 2];
  const lastPart = pathParts[pathParts.length - 1];
  if (secondToLast === 'node_modules' && isCommonDirModuleFile(lastPart)) {
    // /node_modules/index.js
    // /node_modules/lodash.js
    // we just already know this is bogus, so don't bother
    return true;
  }

  return false;
};

export const skipUrlFetch = (url: string) =>
  // files we just already know not to try to resolve request
  knownUrlSkips.some((knownSkip) => url.endsWith(knownSkip));

const knownUrlSkips = [
  '/@stencil/core/runtime.js',
  '/@stencil/core/runtime.json',
  '/@stencil/core/runtime.mjs',
  '/@stencil/core/runtime/stencil-core.js/index.json',
  '/@stencil/core/runtime/stencil-core.js.json',
  '/@stencil/core/runtime/stencil-core.js/package.json',
  '/@stencil/core.js',
  '/@stencil/core.json',
  '/@stencil/core.mjs',
  '/@stencil/core.css',
  '/@stencil/core/index.js',
  '/@stencil/core/index.json',
  '/@stencil/core/index.mjs',
  '/@stencil/core/index.css',
  '/@stencil/package.json',
];
