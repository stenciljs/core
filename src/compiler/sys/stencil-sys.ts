import { createNodeLogger } from '@sys-api-node';
import { isRootPath, join, normalizePath } from '@utils';
import * as os from 'os';
import path, { basename, dirname } from 'path';
import * as process from 'process';

import type {
  CompilerFileWatcherCallback,
  CompilerFsStats,
  CompilerSystem,
  CompilerSystemCreateDirectoryOptions,
  CompilerSystemCreateDirectoryResults,
  CompilerSystemRealpathResults,
  CompilerSystemRemoveDirectoryOptions,
  CompilerSystemRemoveDirectoryResults,
  CompilerSystemRemoveFileResults,
  CompilerSystemRenameResults,
  CompilerSystemWriteFileResults,
  CopyResults,
  CopyTask,
  Logger,
} from '../../declarations';
import { version } from '../../version';
import { buildEvents } from '../events';
import { resolveModuleIdAsync } from './resolve/resolve-module-async';

/**
 * Create an in-memory `CompilerSystem` object, optionally using a supplied
 * logger instance
 *
 * This particular system being an 'in-memory' `CompilerSystem` is intended for
 * use in the browser. In most cases, for instance when using Stencil through
 * the CLI, a Node.js-specific `CompilerSystem` will be used instead. See
 * {@link CompilerSystem} for more details.
 *
 * @param c an object wrapping a logger instance
 * @returns a complete CompilerSystem, ready for use!
 */
export const createSystem = (c?: { logger?: Logger }): CompilerSystem => {
  const logger = c?.logger ?? createNodeLogger();
  const items = new Map<string, FsItem>();
  const destroys = new Set<() => Promise<void> | void>();

  const addDestroy = (cb: () => void) => destroys.add(cb);
  const removeDestroy = (cb: () => void) => destroys.delete(cb);
  const events = buildEvents();
  const hardwareConcurrency = 1;

  const destroy = async () => {
    const waits: Promise<void>[] = [];
    destroys.forEach((cb) => {
      try {
        const rtn = cb();
        if (rtn && typeof rtn.then === 'function') {
          waits.push(rtn);
        }
      } catch (e) {
        logger.error(`stencil sys destroy: ${e}`);
      }
    });
    await Promise.all(waits);
    destroys.clear();
  };

  const normalize = (p: string) => {
    if (p === '/' || p === '') {
      return '/';
    }
    const dir = dirname(p);
    const base = basename(p);
    if (dir.endsWith('/')) {
      return normalizePath(`${dir}${base}`);
    }
    return normalizePath(`${dir}/${base}`);
  };

  const accessSync = (p: string) => {
    const item = items.get(normalize(p));
    return !!(item && (item.isDirectory || (item.isFile && typeof item.data === 'string')));
  };

  const access = async (p: string) => accessSync(p);

  const copyFile = async (src: string, dest: string) => {
    writeFileSync(dest, readFileSync(src));
    return true;
  };

  const isTTY = (): boolean => {
    return !!process?.stdout?.isTTY;
  };

  const homeDir = () => {
    return os.homedir();
  };

  const createDirSync = (p: string, opts?: CompilerSystemCreateDirectoryOptions) => {
    p = normalize(p);
    const results: CompilerSystemCreateDirectoryResults = {
      basename: basename(p),
      dirname: dirname(p),
      path: p,
      newDirs: [],
      error: null,
    };
    createDirRecursiveSync(p, opts, results);
    return results;
  };

  const createDirRecursiveSync = (
    p: string,
    opts: CompilerSystemCreateDirectoryOptions,
    results: CompilerSystemCreateDirectoryResults,
  ) => {
    const parentDir = dirname(p);

    if (opts && opts.recursive && !isRootPath(parentDir)) {
      createDirRecursiveSync(parentDir, opts, results);
    }

    const item = items.get(p);
    if (!item) {
      items.set(p, {
        basename: basename(p),
        dirname: parentDir,
        isDirectory: true,
        isFile: false,
        watcherCallbacks: null,
        data: undefined,
      });
      results.newDirs.push(p);
      emitDirectoryWatch(p, new Set());
    } else {
      item.isDirectory = true;
      item.isFile = false;
    }
  };

  const createDir = async (p: string, opts?: CompilerSystemCreateDirectoryOptions) => createDirSync(p, opts);

  const encodeToBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));

  const getCurrentDirectory = () => '/';

  const getCompilerExecutingPath = () => {
    return sys.getRemoteModuleUrl({ moduleId: '@stencil/core', path: 'compiler/stencil.js' });
  };

  const isSymbolicLink = async (_p: string) => false;

  const readDirSync = (p: string) => {
    p = normalize(p);
    const dirItems: string[] = [];
    const dir = items.get(p);
    if (dir && dir.isDirectory) {
      items.forEach((item, itemPath) => {
        if (itemPath !== '/' && (item.isDirectory || (item.isFile && typeof item.data === 'string'))) {
          if (p.endsWith('/') && `${p}${item.basename}` === itemPath) {
            dirItems.push(itemPath);
          } else if (`${p}/${item.basename}` === itemPath) {
            dirItems.push(itemPath);
          }
        }
      });
    }
    return dirItems.sort();
  };

  const readDir = async (p: string) => readDirSync(p);

  const readFileSync = (p: string) => {
    p = normalize(p);
    const item = items.get(p);
    if (item && item.isFile) {
      return item.data;
    }
    return undefined;
  };

  const readFile = async (p: string) => readFileSync(p);

  const realpathSync = (p: string) => {
    const results: CompilerSystemRealpathResults = {
      path: normalize(p),
      error: null,
    };
    return results;
  };

  const realpath = async (p: string) => realpathSync(p);

  const rename = async (oldPath: string, newPath: string) => {
    oldPath = normalizePath(oldPath);
    newPath = normalizePath(newPath);

    const results: CompilerSystemRenameResults = {
      oldPath,
      newPath,
      renamed: [],
      oldDirs: [],
      oldFiles: [],
      newDirs: [],
      newFiles: [],
      isFile: false,
      isDirectory: false,
      error: null,
    };

    const stats = statSync(oldPath);

    if (!stats.error) {
      if (stats.isFile) {
        results.isFile = true;
      } else if (stats.isDirectory) {
        results.isDirectory = true;
      }

      renameNewRecursiveSync(oldPath, newPath, results);

      if (!results.error) {
        if (results.isDirectory) {
          const rmdirResults = removeDirSync(oldPath, { recursive: true });
          if (rmdirResults.error) {
            results.error = rmdirResults.error;
          } else {
            results.oldDirs.push(...rmdirResults.removedDirs);
            results.oldFiles.push(...rmdirResults.removedFiles);
          }
        } else if (results.isFile) {
          const removeFileResults = removeFileSync(oldPath);
          if (removeFileResults.error) {
            results.error = removeFileResults.error;
          } else {
            results.oldFiles.push(oldPath);
          }
        }
      }
    } else {
      results.error = `${oldPath} does not exist`;
    }

    return results;
  };

  const renameNewRecursiveSync = (oldPath: string, newPath: string, results: CompilerSystemRenameResults) => {
    const itemStat = statSync(oldPath);
    if (!itemStat.error && !results.error) {
      if (itemStat.isFile) {
        const newFileParentDir = dirname(newPath);
        const createDirResults = createDirSync(newFileParentDir, { recursive: true });
        const fileContent = items.get(oldPath).data;
        const writeResults = writeFileSync(newPath, fileContent);

        results.newDirs.push(...createDirResults.newDirs);
        results.renamed.push({
          oldPath,
          newPath,
          isDirectory: false,
          isFile: true,
        });

        if (writeResults.error) {
          results.error = writeResults.error;
        } else {
          results.newFiles.push(newPath);
        }
      } else if (itemStat.isDirectory) {
        const oldDirItemChildPaths = readDirSync(oldPath);
        const createDirResults = createDirSync(newPath, { recursive: true });
        results.newDirs.push(...createDirResults.newDirs);
        results.renamed.push({
          oldPath,
          newPath,
          isDirectory: true,
          isFile: false,
        });

        for (const oldDirItemChildPath of oldDirItemChildPaths) {
          const newDirItemChildPath = oldDirItemChildPath.replace(oldPath, newPath);
          renameNewRecursiveSync(oldDirItemChildPath, newDirItemChildPath, results);
        }
      }
    }
  };

  const resolvePath = (p: string) => normalize(p);

  const removeDirSync = (p: string, opts: CompilerSystemRemoveDirectoryOptions = {}) => {
    const results: CompilerSystemRemoveDirectoryResults = {
      basename: basename(p),
      dirname: dirname(p),
      path: p,
      removedDirs: [],
      removedFiles: [],
      error: null,
    };

    removeDirSyncRecursive(p, opts, results);

    return results;
  };

  const removeDirSyncRecursive = (
    p: string,
    opts: CompilerSystemRemoveDirectoryOptions,
    results: CompilerSystemRemoveDirectoryResults,
  ) => {
    if (!results.error) {
      p = normalize(p);

      const dirItemPaths = readDirSync(p);

      if (opts && opts.recursive) {
        for (const dirItemPath of dirItemPaths) {
          const item = items.get(dirItemPath);
          if (item) {
            if (item.isDirectory) {
              removeDirSyncRecursive(dirItemPath, opts, results);
            } else if (item.isFile) {
              const removeFileResults = removeFileSync(dirItemPath);
              if (removeFileResults.error) {
                results.error = removeFileResults.error;
              } else {
                results.removedFiles.push(dirItemPath);
              }
            }
          }
        }
      } else {
        if (dirItemPaths.length > 0) {
          results.error = `cannot delete directory that contains files/subdirectories`;
          return;
        }
      }

      items.delete(p);
      emitDirectoryWatch(p, new Set());
      results.removedDirs.push(p);
    }
  };

  const removeDir = async (p: string, opts: CompilerSystemRemoveDirectoryOptions = {}) => removeDirSync(p, opts);

  const statSync = (p: string): CompilerFsStats => {
    p = normalize(p);
    const item = items.get(p);
    if (item && (item.isDirectory || (item.isFile && typeof item.data === 'string'))) {
      return {
        isDirectory: item.isDirectory,
        isFile: item.isFile,
        isSymbolicLink: false,
        size: item.isFile && item.data ? item.data.length : 0,
        error: null,
      };
    }
    return {
      isDirectory: false,
      isFile: false,
      isSymbolicLink: false,
      size: 0,
      error: `ENOENT: no such file or directory, statSync '${p}'`,
    };
  };

  const stat = async (p: string) => statSync(p);

  const removeFileSync = (p: string) => {
    p = normalize(p);
    const results: CompilerSystemRemoveFileResults = {
      basename: basename(p),
      dirname: dirname(p),
      path: p,
      error: null,
    };
    const item = items.get(p);
    if (item) {
      if (item.watcherCallbacks) {
        for (const watcherCallback of item.watcherCallbacks) {
          watcherCallback(p, 'fileDelete');
        }
      }
      items.delete(p);
      emitDirectoryWatch(p, new Set());
    }
    return results;
  };

  const removeFile = async (p: string) => removeFileSync(p);

  const watchDirectory = (p: string, dirWatcherCallback: CompilerFileWatcherCallback) => {
    p = normalize(p);
    const item = items.get(p);

    const close = () => {
      const closeItem = items.get(p);
      if (closeItem && closeItem.watcherCallbacks) {
        const index = closeItem.watcherCallbacks.indexOf(dirWatcherCallback);
        if (index > -1) {
          closeItem.watcherCallbacks.splice(index, 1);
        }
      }
    };

    addDestroy(close);

    if (item) {
      item.isDirectory = true;
      item.isFile = false;
      item.watcherCallbacks = item.watcherCallbacks || [];
      item.watcherCallbacks.push(dirWatcherCallback);
    } else {
      items.set(p, {
        basename: basename(p),
        dirname: dirname(p),
        isDirectory: true,
        isFile: false,
        watcherCallbacks: [dirWatcherCallback],
        data: undefined,
      });
    }

    return {
      close() {
        removeDestroy(close);
        close();
      },
    };
  };

  const watchFile = (p: string, fileWatcherCallback: CompilerFileWatcherCallback) => {
    p = normalize(p);
    const item = items.get(p);

    const close = () => {
      const closeItem = items.get(p);
      if (closeItem && closeItem.watcherCallbacks) {
        const index = closeItem.watcherCallbacks.indexOf(fileWatcherCallback);
        if (index > -1) {
          closeItem.watcherCallbacks.splice(index, 1);
        }
      }
    };

    addDestroy(close);

    if (item) {
      item.isDirectory = false;
      item.isFile = true;
      item.watcherCallbacks = item.watcherCallbacks || [];
      item.watcherCallbacks.push(fileWatcherCallback);
    } else {
      items.set(p, {
        basename: basename(p),
        dirname: dirname(p),
        isDirectory: false,
        isFile: true,
        watcherCallbacks: [fileWatcherCallback],
        data: undefined,
      });
    }

    return {
      close() {
        removeDestroy(close);
        close();
      },
    };
  };

  const emitDirectoryWatch = (p: string, emitted: Set<string>) => {
    const parentDir = normalize(dirname(p));
    const dirItem = items.get(parentDir);

    if (dirItem && dirItem.isDirectory && dirItem.watcherCallbacks) {
      for (const watcherCallback of dirItem.watcherCallbacks) {
        watcherCallback(p, null);
      }
    }
    if (!emitted.has(parentDir)) {
      emitted.add(parentDir);
      emitDirectoryWatch(parentDir, emitted);
    }
  };

  const writeFileSync = (p: string, data: string) => {
    p = normalize(p);
    const results: CompilerSystemWriteFileResults = {
      path: p,
      error: null,
    };
    const item = items.get(p);
    if (item) {
      const hasChanged = item.data !== data;
      item.data = data;
      if (hasChanged && item.watcherCallbacks) {
        for (const watcherCallback of item.watcherCallbacks) {
          watcherCallback(p, 'fileUpdate');
        }
      }
    } else {
      items.set(p, {
        basename: basename(p),
        dirname: dirname(p),
        isDirectory: false,
        isFile: true,
        watcherCallbacks: null,
        data,
      });

      emitDirectoryWatch(p, new Set());
    }
    return results;
  };

  /**
   * `self` is the global namespace object used within a web worker.
   * `window` is the browser's global namespace object (I reorganized this to check the reference on that second)
   * `global` is Node's global namespace object. https://nodejs.org/api/globals.html#globals_global
   *
   * loading in this order should allow workers, which are most common, then browser,
   * then Node to grab the reference to fetch correctly.
   */
  const fetch =
    typeof self !== 'undefined'
      ? self?.fetch
      : typeof window !== 'undefined'
        ? window?.fetch
        : typeof global !== 'undefined'
          ? global?.fetch
          : undefined;

  const writeFile = async (p: string, data: string) => writeFileSync(p, data);

  const tmpDirSync = () => '/.tmp';

  const tick = Promise.resolve();

  const nextTick = (cb: () => void) => tick.then(cb);

  const generateContentHash = async (content: string, hashLength: number) => {
    const arrayBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
    const hashArray = Array.from(new Uint8Array(arrayBuffer)); // convert buffer to byte array
    let hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    if (typeof hashLength === 'number') {
      hashHex = hashHex.slice(0, hashLength);
    }
    return hashHex;
  };

  const copy = async (copyTasks: Required<CopyTask>[], srcDir: string) => {
    const results: CopyResults = {
      diagnostics: [],
      dirPaths: [],
      filePaths: [],
    };
    logger.info('todo, copy task', copyTasks.length, srcDir);
    return results;
  };

  const getEnvironmentVar = (key: string) => {
    return process?.env[key];
  };

  const getLocalModulePath = (opts: { rootDir: string; moduleId: string; path: string }) =>
    join(opts.rootDir, 'node_modules', opts.moduleId, opts.path);

  const getRemoteModuleUrl = (opts: { moduleId: string; path: string; version?: string }) => {
    const npmBaseUrl = 'https://cdn.jsdelivr.net/npm/';
    const path = `${opts.moduleId}${opts.version ? '@' + opts.version : ''}/${opts.path}`;
    return new URL(path, npmBaseUrl).href;
  };

  const fileWatchTimeout = 32;

  createDirSync('/');

  const sys: CompilerSystem = {
    name: 'in-memory',
    version,
    events,
    access,
    accessSync,
    addDestroy,
    copyFile,
    createDir,
    createDirSync,
    homeDir,
    isTTY,
    getEnvironmentVar,
    destroy,
    encodeToBase64,
    exit: async (exitCode) => logger.warn(`exit ${exitCode}`),
    getCurrentDirectory,
    getCompilerExecutingPath,
    getLocalModulePath,
    getRemoteModuleUrl,
    hardwareConcurrency,
    isSymbolicLink,
    nextTick,
    normalizePath: normalize,
    platformPath: path,
    readDir,
    readDirSync,
    readFile,
    readFileSync,
    realpath,
    realpathSync,
    removeDestroy,
    rename,
    fetch,
    resolvePath,
    removeDir,
    removeDirSync,
    stat,
    statSync,
    tmpDirSync,
    removeFile,
    removeFileSync,
    watchDirectory,
    watchFile,
    watchTimeout: fileWatchTimeout,
    writeFile,
    writeFileSync,
    generateContentHash,
    // no threading when we're running in-memory
    createWorkerController: null,
    details: {
      cpuModel: '',
      freemem: () => 0,
      platform: '',
      release: '',
      totalmem: 0,
    },
    copy,
  };

  sys.resolveModuleId = (opts) => resolveModuleIdAsync(sys, null, opts);

  return sys;
};

interface FsItem {
  data: string;
  basename: string;
  dirname: string;
  isFile: boolean;
  isDirectory: boolean;
  watcherCallbacks: CompilerFileWatcherCallback[];
}
