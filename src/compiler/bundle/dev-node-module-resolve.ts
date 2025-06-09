import { join, relative } from '@utils';
import { basename, dirname } from 'path';
import { ResolveIdResult } from 'rollup';

import type * as d from '../../declarations';
import { InMemoryFileSystem } from '../sys/in-memory-fs';
import { DEV_MODULE_DIR } from './constants';

export const devNodeModuleResolveId = async (
  config: d.ValidatedConfig,
  inMemoryFs: InMemoryFileSystem,
  resolvedId: ResolveIdResult,
  importee: string,
) => {
  if (!shouldCheckDevModule(resolvedId, importee)) {
    return resolvedId;
  }

  if (typeof resolvedId === 'string' || !resolvedId) {
    return resolvedId;
  }

  const resolvedPath = resolvedId.id;

  const pkgPath = getPackageJsonPath(resolvedPath, importee);
  if (!pkgPath) {
    return resolvedId;
  }

  const pkgJsonStr = await inMemoryFs.readFile(pkgPath);
  if (!pkgJsonStr) {
    return resolvedId;
  }

  let pkgJsonData: d.PackageJsonData;
  try {
    pkgJsonData = JSON.parse(pkgJsonStr);
  } catch (e) {}

  if (!pkgJsonData || !pkgJsonData.version) {
    return resolvedId;
  }

  resolvedId.id = serializeDevNodeModuleUrl(config, pkgJsonData.name, pkgJsonData.version, resolvedPath);
  resolvedId.external = true;

  return resolvedId;
};

const shouldCheckDevModule = (resolvedId: ResolveIdResult, importee: string) =>
  resolvedId &&
  importee &&
  typeof resolvedId !== 'string' &&
  resolvedId.id &&
  resolvedId.id.includes('node_modules') &&
  (resolvedId.id.endsWith('.js') || resolvedId.id.endsWith('.mjs')) &&
  !resolvedId.external &&
  !importee.startsWith('.') &&
  !importee.startsWith('/');

const getPackageJsonPath = (resolvedPath: string, importee: string): string => {
  let currentPath = resolvedPath;
  for (let i = 0; i < 10; i++) {
    currentPath = dirname(currentPath);
    const aBasename = basename(currentPath);

    const upDir = dirname(currentPath);
    const bBasename = basename(upDir);
    if (aBasename === importee && bBasename === 'node_modules') {
      return join(currentPath, 'package.json');
    }
  }
  return null;
};

const serializeDevNodeModuleUrl = (
  config: d.ValidatedConfig,
  moduleId: string,
  moduleVersion: string,
  resolvedPath: string,
) => {
  resolvedPath = relative(config.rootDir, resolvedPath);

  let id = `/${DEV_MODULE_DIR}/`;
  id += encodeURIComponent(moduleId) + '@';
  id += encodeURIComponent(moduleVersion) + '.js';
  id += '?p=' + encodeURIComponent(resolvedPath);
  return id;
};
