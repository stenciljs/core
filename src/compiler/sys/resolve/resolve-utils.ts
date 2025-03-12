import { normalizePath } from '@utils';

import type * as d from '../../../declarations';

const COMMON_DIR_MODULE_EXTS = ['.tsx', '.ts', '.mts', '.cts', '.mjs', '.js', '.cjs', '.jsx', '.json', '.md'];

/**
 * Determine if a stringified file path is a TypeScript declaration file based on the extension at the end of the path.
 * @param p the path to evaluate
 * @returns `true` if the path ends in `.d.ts` (case-sensitive), `false` otherwise.
 */
export const isDtsFile = (p: string) => p.endsWith('.d.ts') || p.endsWith('.d.mts');

/**
 * Determine if a stringified file path is a TypeScript file based on the extension at the end of the path. This
 * function does _not_ consider type declaration files (`.d.ts` files) to be TypeScript files.
 * @param p the path to evaluate
 * @returns `true` if the path ends in `.ts` (case-sensitive) but does _not_ end in `.d.ts`, `false` otherwise.
 */
export const isTsFile = (p: string) => !isDtsFile(p) && p.endsWith('.ts');

/**
 * Determine if a stringified file path is a TSX file based on the extension at the end of the path
 * @param p the path to evaluate
 * @returns `true` if the path ends in `.tsx` (case-sensitive), `false` otherwise.
 */
export const isTsxFile = (p: string) => p.endsWith('.tsx');

/**
 * Determine if a stringified file path is a JSX file based on the extension at the end of the path
 * @param p the path to evaluate
 * @returns `true` if the path ends in `.jsx` (case-sensitive), `false` otherwise.
 */
export const isJsxFile = (p: string) => p.endsWith('.jsx');

/**
 * Determine if a stringified file path is a JavaScript file based on the extension at the end of the path
 * @param p the path to evaluate
 * @returns `true` if the path ends in `.js` (case-sensitive), `false` otherwise.
 */
export const isJsFile = (p: string) => p.endsWith('.js');

export const isCommonDirModuleFile = (p: string) => COMMON_DIR_MODULE_EXTS.some((ext) => p.endsWith(ext));

export const setPackageVersion = (pkgVersions: Map<string, string>, pkgName: string, pkgVersion: string) => {
  pkgVersions.set(pkgName, pkgVersion);
};

export const setPackageVersionByContent = (pkgVersions: Map<string, string>, pkgContent: string) => {
  try {
    const pkg = JSON.parse(pkgContent) as d.PackageJsonData;
    if (pkg.name && pkg.version) {
      setPackageVersion(pkgVersions, pkg.name, pkg.version);
    }
  } catch (e) {}
};

export const isLocalModule = (p: string) => p.startsWith('.') || p.startsWith('/');

export const isStencilCoreImport = (p: string) => p.startsWith('@stencil/core');

export const isNodeModulePath = (p: string) => normalizePath(p).split('/').includes('node_modules');

export const getModuleId = (orgImport: string) => {
  if (orgImport.startsWith('~')) {
    orgImport = orgImport.substring(1);
  }
  const splt = orgImport.split('/');
  const m = {
    moduleId: null as string,
    filePath: null as string,
    scope: null as string,
    scopeSubModuleId: null as string,
  };

  if (orgImport.startsWith('@') && splt.length > 1) {
    m.moduleId = splt.slice(0, 2).join('/');
    m.filePath = splt.slice(2).join('/');
    m.scope = splt[0];
    m.scopeSubModuleId = splt[1];
  } else {
    m.moduleId = splt[0];
    m.filePath = splt.slice(1).join('/');
  }

  return m;
};

export const getPackageDirPath = (p: string, moduleId: string) => {
  const parts = normalizePath(p).split('/');
  const m = getModuleId(moduleId);
  for (let i = parts.length - 1; i >= 1; i--) {
    if (parts[i - 1] === 'node_modules') {
      if (m.scope) {
        if (parts[i] === m.scope && parts[i + 1] === m.scopeSubModuleId) {
          return parts.slice(0, i + 2).join('/');
        }
      } else if (parts[i] === m.moduleId) {
        return parts.slice(0, i + 1).join('/');
      }
    }
  }
  return null;
};
