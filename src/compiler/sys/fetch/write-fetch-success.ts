import { dirname } from 'path';

import type * as d from '../../../declarations';
import { InMemoryFileSystem } from '../in-memory-fs';
import { setPackageVersionByContent } from '../resolve/resolve-utils';

export const writeFetchSuccessSync = (
  sys: d.CompilerSystem,
  inMemoryFs: InMemoryFileSystem,
  url: string,
  filePath: string,
  content: string,
  pkgVersions: Map<string, string>,
) => {
  if (url.endsWith('package.json')) {
    setPackageVersionByContent(pkgVersions, content);
  }

  let dir = dirname(filePath);
  while (dir !== '/' && dir !== '') {
    if (inMemoryFs) {
      inMemoryFs.clearFileCache(dir);
      inMemoryFs.sys.createDirSync(dir);
    } else {
      sys.createDirSync(dir);
    }

    dir = dirname(dir);
  }

  if (inMemoryFs) {
    inMemoryFs.clearFileCache(filePath);
    inMemoryFs.sys.writeFileSync(filePath, content);
  } else {
    sys.writeFileSync(filePath, content);
  }
};

export const writeFetchSuccessAsync = async (
  sys: d.CompilerSystem,
  inMemoryFs: InMemoryFileSystem,
  url: string,
  filePath: string,
  content: string,
  pkgVersions: Map<string, string>,
) => {
  if (url.endsWith('package.json')) {
    setPackageVersionByContent(pkgVersions, content);
  }

  let dir = dirname(filePath);
  while (dir !== '/' && dir !== '') {
    if (inMemoryFs) {
      inMemoryFs.clearFileCache(dir);
      await inMemoryFs.sys.createDir(dir);
    } else {
      await sys.createDir(dir);
    }

    dir = dirname(dir);
  }

  if (inMemoryFs) {
    inMemoryFs.clearFileCache(filePath);
    await inMemoryFs.sys.writeFile(filePath, content);
  } else {
    await sys.writeFile(filePath, content);
  }
};
