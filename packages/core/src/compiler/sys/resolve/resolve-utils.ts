import { normalizePath } from '../../../utils';

import type * as d from '../../../declarations';

const COMMON_DIR_MODULE_EXTS = ['.tsx', '.ts', '.mts', '.cts', '.mjs', '.js', '.cjs', '.jsx', '.json', '.md'];

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
