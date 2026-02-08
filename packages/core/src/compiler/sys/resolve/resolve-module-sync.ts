import { isString, normalizeFsPath, normalizePath } from '@utils';
import { dirname } from 'path';
import resolve, { SyncOpts } from 'resolve';

import type * as d from '../../../declarations';
import { InMemoryFileSystem } from '../in-memory-fs';

export const resolveRemoteModuleIdSync = (
  config: d.Config,
  inMemoryFs: InMemoryFileSystem,
  opts: d.ResolveModuleIdOptions,
) => {
  const packageJson = resolveRemotePackageJsonSync(config, inMemoryFs, opts.moduleId);
  if (packageJson) {
    const resolveModuleSyncOpts: d.ResolveModuleIdOptions = {
      ...opts,
      exts: ['.js', '.mjs'],
    };
    const resolvedUrl = resolveModuleIdSync(config.sys, inMemoryFs, resolveModuleSyncOpts);
    if (typeof resolvedUrl === 'string') {
      return {
        resolvedUrl,
        packageJson,
      };
    }
  }
  return null;
};

const resolveRemotePackageJsonSync = (config: d.Config, inMemoryFs: InMemoryFileSystem, moduleId: string) => {
  if (inMemoryFs) {
    const filePath = normalizePath(
      config.sys.getLocalModulePath({ rootDir: config.rootDir, moduleId, path: 'package.json' }),
    );
    const pkgJson = inMemoryFs.readFileSync(filePath);
    if (typeof pkgJson === 'string') {
      try {
        return JSON.parse(pkgJson) as d.PackageJsonData;
      } catch (e) {}
    }
  }
  return null;
};

export const resolveModuleIdSync = (
  sys: d.CompilerSystem,
  inMemoryFs: InMemoryFileSystem,
  opts: d.ResolveModuleIdOptions,
) => {
  if (inMemoryFs) {
    const resolverOpts = createCustomResolverSync(sys, inMemoryFs, opts.exts);
    resolverOpts.basedir = dirname(opts.containingFile);
    resolverOpts.packageFilter = opts.packageFilter;

    const resolvedModule = resolve.sync(opts.moduleId, resolverOpts);
    return resolvedModule;
  }
  return null;
};

export const createCustomResolverSync = (
  sys: d.CompilerSystem,
  inMemoryFs: InMemoryFileSystem,
  exts: string[],
): SyncOpts => {
  return {
    isFile(filePath: string) {
      const fsFilePath = normalizeFsPath(filePath);

      const stat = inMemoryFs.statSync(fsFilePath);
      return stat.isFile;
    },

    isDirectory(dirPath: string) {
      const fsDirPath = normalizeFsPath(dirPath);

      const stat = inMemoryFs.statSync(fsDirPath);
      return stat.isDirectory;
    },

    readFileSync(p: string) {
      const data = inMemoryFs.readFileSync(p);
      if (isString(data)) {
        return data;
      }

      throw new Error(`file not found: ${p}`);
    },

    realpathSync(p: string) {
      const fsFilePath = normalizeFsPath(p);
      try {
        return sys.realpathSync(fsFilePath);
      } catch (realpathErr: unknown) {
        if (isErrnoException(realpathErr)) {
          if (realpathErr.code !== 'ENOENT') {
            throw realpathErr;
          }
        }
      }
      return fsFilePath;
    },

    extensions: exts,
  } as any;
};

/**
 * Type guard to determine if an Error is an instance of `ErrnoException`. For the purposes of this type guard, we
 * must ensure that the `code` field is present. This type guard was written with the `ErrnoException` definition from
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d121716ed123957f6a86f8985eb013fcaddab345/types/node/globals.d.ts#L183-L188
 * in mind.
 * @param err the entity to check the type of
 * @returns true if the provided value is an instance of `ErrnoException`, `false` otherwise
 */
function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && err.hasOwnProperty('code');
}
