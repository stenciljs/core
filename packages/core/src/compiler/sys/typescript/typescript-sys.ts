import { basename } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { isRemoteUrl, isString, noop, normalizePath, resolve } from '../../../utils';
import { IS_CASE_SENSITIVE_FILE_NAMES } from '../environment';
import { InMemoryFileSystem } from '../in-memory-fs';

export const patchTsSystemFileSystem = (
  config: d.ValidatedConfig,
  compilerSys: d.CompilerSystem,
  inMemoryFs: InMemoryFileSystem | null,
  tsSys: ts.System,
): ts.System => {
  const realpath = (path: string) => {
    const rp = compilerSys.realpathSync(path);
    if (isString(rp)) {
      return rp;
    }
    return path;
  };

  const getAccessibleFileSystemEntries = (path: string) => {
    try {
      const entries = compilerSys.readDirSync(path || '.').sort();
      const files: string[] = [];
      const directories: string[] = [];

      for (const absPath of entries) {
        // This is necessary because on some file system node fails to exclude
        // "." and "..". See https://github.com/nodejs/node/issues/4002
        const stat = inMemoryFs.statSync(absPath);
        if (!stat) {
          continue;
        }

        const entry = basename(absPath);
        if (stat.isFile) {
          files.push(entry);
        } else if (stat.isDirectory) {
          directories.push(entry);
        }
      }
      return { files, directories };
    } catch {
      return { files: [], directories: [] };
    }
  };

  tsSys.createDirectory = (p) => {
    compilerSys.createDirSync(p, { recursive: true });
  };

  tsSys.directoryExists = (p) => {
    if (inMemoryFs) {
      const s = inMemoryFs.statSync(p);
      return s.isDirectory;
    } else {
      const s = compilerSys.statSync(p);
      return s.isDirectory;
    }
  };

  tsSys.exit = compilerSys.exit;

  tsSys.fileExists = (p) => {
    let filePath = p;

    if (isRemoteUrl(p)) {
      filePath = getTypescriptPathFromUrl(config, tsSys.getExecutingFilePath(), p);
    }

    if (inMemoryFs) {
      const s = inMemoryFs.statSync(filePath);
      return !!(s && s.isFile);
    } else {
      const s = compilerSys.statSync(filePath);
      return !!(s && s.isFile);
    }
  };

  tsSys.getCurrentDirectory = compilerSys.getCurrentDirectory;

  // Use TypeScript's actual path for lib file resolution (not Stencil's compiler path)
  // This allows TypeScript to find its lib.*.d.ts files in node_modules/typescript/lib/
  tsSys.getExecutingFilePath = () => {
    try {
      // Get TypeScript's actual location for lib file resolution
      return require.resolve('typescript');
    } catch {
      // Fallback to Stencil's compiler path
      return compilerSys.getCompilerExecutingPath();
    }
  };

  tsSys.getDirectories = (p) => {
    const items = compilerSys.readDirSync(p);
    return items.filter((itemPath) => {
      if (inMemoryFs) {
        const s = inMemoryFs.statSync(itemPath);
        return !!(s && s.exists && s.isDirectory);
      } else {
        const s = compilerSys.statSync(itemPath);
        return !!(s && s.isDirectory);
      }
    });
  };

  tsSys.readDirectory = (path, extensions, exclude, include, depth) => {
    const cwd = compilerSys.getCurrentDirectory();
    // `matchFiles` is an internal TypeScript API with no public equivalent — it handles
    // extension filtering, exclusion patterns, and depth traversal in one call.
    return (ts as any).matchFiles(
      path,
      extensions,
      exclude,
      include,
      IS_CASE_SENSITIVE_FILE_NAMES,
      cwd,
      depth,
      getAccessibleFileSystemEntries,
      realpath,
    );
  };

  tsSys.readFile = (filePath) => {
    return inMemoryFs
      ? inMemoryFs.readFileSync(filePath, { useCache: false })
      : compilerSys.readFileSync(filePath);
  };

  tsSys.writeFile = (p, data) =>
    inMemoryFs ? inMemoryFs.writeFile(p, data) : compilerSys.writeFile(p, data);

  return tsSys;
};

const patchTsSystemWatch = (compilerSystem: d.CompilerSystem, tsSys: ts.System) => {
  tsSys.watchDirectory = (p, cb, recursive) => {
    const watcher = compilerSystem.watchDirectory(
      p,
      (filePath) => {
        cb(filePath);
      },
      recursive,
    );
    return {
      close() {
        watcher.close();
      },
    };
  };

  tsSys.watchFile = (p, cb) => {
    const watcher = compilerSystem.watchFile(p, (filePath, eventKind) => {
      if (eventKind === 'fileAdd') {
        cb(filePath, ts.FileWatcherEventKind.Created);
      } else if (eventKind === 'fileUpdate') {
        cb(filePath, ts.FileWatcherEventKind.Changed);
      } else if (eventKind === 'fileDelete') {
        cb(filePath, ts.FileWatcherEventKind.Deleted);
      }
    });
    return {
      close() {
        watcher.close();
      },
    };
  };
};

export const patchTypescript = (
  config: d.ValidatedConfig,
  inMemoryFs: InMemoryFileSystem | null,
) => {
  // Always re-patch so ts.sys stays bound to the current compiler's inMemoryFs.
  // Multiple compilers may exist in the same process (e.g. test suites), and the
  // fs closures must point at the active instance.
  patchTsSystemFileSystem(config, config.sys, inMemoryFs, ts.sys);
  patchTsSystemWatch(config.sys, ts.sys);
};

const patchTypeScriptSysMinimum = () => {
  if (!ts.sys) {
    // patches just the bare minimum
    // if ts.sys already exists then it must be node ts.sys
    // otherwise we're browser
    // will be updated later on with the stencil sys
    ts.sys = {
      args: [],
      createDirectory: noop,
      directoryExists: () => false,
      exit: noop,
      fileExists: () => false,
      getCurrentDirectory: process.cwd,
      getDirectories: () => [],
      getExecutingFilePath: () => './',
      readDirectory: () => [],
      readFile: noop,
      newLine: '\n',
      resolvePath: resolve,
      useCaseSensitiveFileNames: false,
      write: noop,
      writeFile: noop,
    };
  }
};
patchTypeScriptSysMinimum();

export const getTypescriptPathFromUrl = (
  config: d.ValidatedConfig,
  tsExecutingUrl: string,
  url: string,
) => {
  const tsBaseUrl = new URL('..', tsExecutingUrl).href;
  if (url.startsWith(tsBaseUrl)) {
    const tsFilePath = url.replace(tsBaseUrl, '/');
    const tsNodePath = config.sys.getLocalModulePath({
      rootDir: config.rootDir,
      moduleId: '@stencil/core',
      path: tsFilePath,
    });
    return normalizePath(tsNodePath);
  }
  return url;
};
