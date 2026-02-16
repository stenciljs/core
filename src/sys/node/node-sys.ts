import { isFunction, normalizePath } from '@utils';
import { parse as parseYarnLockFile } from '@yarnpkg/lockfile';
import { createHash } from 'crypto';
import exit from 'exit';
import fs from 'graceful-fs';
import { cpus, freemem, platform, release, tmpdir, totalmem } from 'os';
import * as os from 'os';
import path from 'path';
import type TypeScript from 'typescript';

import { buildEvents } from '../../compiler/events';
import type {
  CompilerFileWatcher,
  CompilerFileWatcherCallback,
  CompilerSystem,
  CompilerSystemCreateDirectoryResults,
  CompilerSystemRealpathResults,
  CompilerSystemRemoveFileResults,
  CompilerSystemWriteFileResults,
  Logger,
} from '../../declarations';
import { asyncGlob, nodeCopyTasks } from './node-copy-tasks';
import { NodeLazyRequire } from './node-lazy-require';
import { NodeResolveModule } from './node-resolve-module';
import { checkVersion } from './node-stencil-version-checker';
import { NodeWorkerController } from './node-worker-controller';

/**
 * Create a node.js-specific {@link CompilerSystem} to be used when Stencil is
 * run from the CLI or via the public API in a node context.
 *
 * This takes an optional param supplying a `process` object to be used.
 *
 * @param c an optional object wrapping `process` and `logger` objects
 * @returns a node.js `CompilerSystem` object
 */
export function createNodeSys(c: { process?: any; logger?: Logger } = {}): CompilerSystem {
  const prcs: NodeJS.Process = c?.process ?? global.process;
  const logger: Logger | undefined = c?.logger;
  const destroys = new Set<() => Promise<void> | void>();
  const onInterruptsCallbacks: (() => void)[] = [];

  const sysCpus = cpus();
  const hardwareConcurrency = sysCpus.length;
  const osPlatform = platform();

  const compilerExecutingPath = path.join(__dirname, '..', '..', 'compiler', 'stencil.js');
  const devServerExecutingPath = path.join(__dirname, '..', '..', 'dev-server', 'index.js');

  const runInterruptsCallbacks = () => {
    const returnValues: Promise<any>[] = [];
    let cb: () => any;
    while (isFunction((cb = onInterruptsCallbacks.pop()))) {
      try {
        const rtn = cb();
        returnValues.push(rtn);
      } catch (e) {}
    }
    return Promise.all(returnValues).then(() => {});
  };

  const sys: CompilerSystem = {
    name: 'node',
    version: prcs.versions.node,
    access(p) {
      return new Promise((resolve) => {
        fs.access(p, (err) => resolve(!err));
      });
    },
    accessSync(p) {
      let hasAccess = false;
      try {
        fs.accessSync(p);
        hasAccess = true;
      } catch (e) {}
      return hasAccess;
    },
    addDestroy(cb) {
      destroys.add(cb);
    },
    removeDestroy(cb) {
      destroys.delete(cb);
    },
    applyPrerenderGlobalPatch(opts) {
      if (typeof global.fetch !== 'function') {
        const nodeFetch = require(path.join(__dirname, 'node-fetch.js'));

        global.fetch = (input: any, init: any) => {
          if (typeof input === 'string') {
            // fetch(url) w/ url string
            const urlStr = new URL(input, opts.devServerHostUrl).href;
            return nodeFetch.fetch(urlStr, init);
          } else {
            // fetch(Request) w/ request object
            input.url = new URL(input.url, opts.devServerHostUrl).href;
            return nodeFetch.fetch(input, init);
          }
        };

        global.Headers = nodeFetch.Headers;
        global.Request = nodeFetch.Request;
        global.Response = nodeFetch.Response;
        (global as any).FetchError = nodeFetch.FetchError;
      }

      opts.window.fetch = global.fetch;
      opts.window.Headers = global.Headers;
      opts.window.Request = global.Request;
      opts.window.Response = global.Response;
      opts.window.FetchError = (global as any).FetchError;
    },
    fetch: (input: any, init: any) => {
      const nodeFetch = require(path.join(__dirname, 'node-fetch.js'));

      if (typeof input === 'string') {
        // fetch(url) w/ url string
        const urlStr = new URL(input).href;
        return nodeFetch.fetch(urlStr, init);
      } else {
        // fetch(Request) w/ request object
        input.url = new URL(input.url).href;
        return nodeFetch.fetch(input, init);
      }
    },
    checkVersion,
    copyFile(src, dst) {
      return new Promise((resolve) => {
        fs.copyFile(src, dst, (err) => {
          resolve(!err);
        });
      });
    },
    createDir(p, opts) {
      return new Promise((resolve) => {
        if (opts) {
          fs.mkdir(p, opts, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              path: p,
              newDirs: [],
              error: err,
            });
          });
        } else {
          fs.mkdir(p, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              path: p,
              newDirs: [],
              error: err,
            });
          });
        }
      });
    },
    createDirSync(p, opts) {
      const results: CompilerSystemCreateDirectoryResults = {
        basename: path.basename(p),
        dirname: path.dirname(p),
        path: p,
        newDirs: [],
        error: null,
      };
      try {
        fs.mkdirSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    createWorkerController(maxConcurrentWorkers) {
      const forkModulePath = path.join(__dirname, 'worker.js');
      return new NodeWorkerController(forkModulePath, maxConcurrentWorkers);
    },
    async destroy() {
      const waits: Promise<void>[] = [];
      destroys.forEach((cb) => {
        try {
          const rtn = cb();
          if (rtn && typeof rtn.then === 'function') {
            waits.push(rtn);
          }
        } catch (e) {
          console.error(`node sys destroy: ${e}`);
        }
      });
      if (waits.length > 0) {
        await Promise.all(waits);
      }
      destroys.clear();
    },
    dynamicImport(p) {
      return Promise.resolve(require(p));
    },
    encodeToBase64(str) {
      return Buffer.from(str).toString('base64');
    },
    async ensureDependencies() {
      // TODO(STENCIL-727): Remove this from the sys interface
      console.warn(`ensureDependencies will be removed in a future version of Stencil.`);
      console.warn(`To get the stencilPath, please use getCompilerExecutingPath().`);

      return {
        stencilPath: sys.getCompilerExecutingPath(),
        diagnostics: [],
      };
    },
    async ensureResources() {
      // TODO(STENCIL-727): Remove this from the sys interface
      console.warn(`ensureResources is a no-op, and will be removed in a future version of Stencil`);
    },
    exit: async (exitCode) => {
      await runInterruptsCallbacks();
      exit(exitCode);
    },
    getCurrentDirectory() {
      return normalizePath(prcs.cwd());
    },
    getCompilerExecutingPath() {
      return compilerExecutingPath;
    },
    getDevServerExecutingPath() {
      return devServerExecutingPath;
    },
    getEnvironmentVar(key) {
      return process.env[key];
    },
    getLocalModulePath() {
      return null;
    },
    getRemoteModuleUrl() {
      return null;
    },
    glob: asyncGlob,
    hardwareConcurrency,
    isSymbolicLink(p: string) {
      return new Promise<boolean>((resolve) => {
        try {
          fs.lstat(p, (err, stats) => {
            if (err) {
              resolve(false);
            } else {
              resolve(stats.isSymbolicLink());
            }
          });
        } catch (e) {
          resolve(false);
        }
      });
    },
    nextTick: prcs.nextTick,
    normalizePath,
    onProcessInterrupt: (cb) => {
      if (!onInterruptsCallbacks.includes(cb)) {
        onInterruptsCallbacks.push(cb);
      }
    },
    platformPath: path,
    readDir(p) {
      return new Promise((resolve) => {
        fs.readdir(p, (err, files) => {
          if (err) {
            resolve([]);
          } else {
            resolve(
              files.map((f) => {
                return normalizePath(path.join(p, f));
              }),
            );
          }
        });
      });
    },
    parseYarnLockFile(content: string) {
      return parseYarnLockFile(content);
    },
    isTTY() {
      return !!process?.stdout?.isTTY;
    },
    readDirSync(p) {
      try {
        return fs.readdirSync(p).map((f) => {
          return normalizePath(path.join(p, f));
        });
      } catch (e) {}
      return [];
    },
    readFile(p: string, encoding?: string) {
      if (encoding === 'binary') {
        return new Promise<any>((resolve) => {
          fs.readFile(p, (_, data) => {
            resolve(data);
          });
        });
      }
      return new Promise<string>((resolve) => {
        fs.readFile(p, 'utf8', (_, data) => {
          resolve(data);
        });
      });
    },
    readFileSync(p) {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch (e) {}
      return undefined;
    },
    homeDir() {
      try {
        return os.homedir();
      } catch (e) {}
      return undefined;
    },
    realpath(p) {
      return new Promise((resolve) => {
        fs.realpath(p, 'utf8', (e, data) => {
          resolve({
            path: data,
            error: e,
          });
        });
      });
    },
    realpathSync(p) {
      const results: CompilerSystemRealpathResults = {
        path: undefined,
        error: null,
      };
      try {
        results.path = fs.realpathSync(p, 'utf8');
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    rename(oldPath, newPath) {
      return new Promise((resolve) => {
        fs.rename(oldPath, newPath, (error) => {
          resolve({
            oldPath,
            newPath,
            error,
            oldDirs: [],
            oldFiles: [],
            newDirs: [],
            newFiles: [],
            renamed: [],
            isFile: false,
            isDirectory: false,
          });
        });
      });
    },
    resolvePath(p) {
      return normalizePath(p);
    },
    removeDir(p, opts) {
      return new Promise((resolve) => {
        const recursive = !!(opts && opts.recursive);
        if (recursive) {
          fs.rm(p, { recursive: true, force: true }, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              path: p,
              removedDirs: [],
              removedFiles: [],
              error: err,
            });
          });
        } else {
          fs.rmdir(p, (err) => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              path: p,
              removedDirs: [],
              removedFiles: [],
              error: err,
            });
          });
        }
      });
    },
    removeDirSync(p, opts) {
      try {
        const recursive = !!(opts && opts.recursive);
        if (recursive) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.rmdirSync(p);
        }
        return {
          basename: path.basename(p),
          dirname: path.dirname(p),
          path: p,
          removedDirs: [],
          removedFiles: [],
          error: null,
        };
      } catch (e) {
        return {
          basename: path.basename(p),
          dirname: path.dirname(p),
          path: p,
          removedDirs: [],
          removedFiles: [],
          error: e,
        };
      }
    },
    removeFile(p) {
      return new Promise((resolve) => {
        fs.unlink(p, (err) => {
          resolve({
            basename: path.basename(p),
            dirname: path.dirname(p),
            path: p,
            error: err,
          });
        });
      });
    },
    removeFileSync(p) {
      const results: CompilerSystemRemoveFileResults = {
        basename: path.basename(p),
        dirname: path.dirname(p),
        path: p,
        error: null,
      };
      try {
        fs.unlinkSync(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    setupCompiler(c) {
      // save references to typescript utilities so that we can wrap them
      const ts: typeof TypeScript = c.ts;
      const tsSysWatchDirectory = ts.sys.watchDirectory;
      const tsSysWatchFile = ts.sys.watchFile;

      sys.watchTimeout = 80;

      sys.events = buildEvents();

      sys.watchDirectory = (p, callback, recursive) => {
        logger?.debug(`NODE_SYS_DEBUG::watchDir ${p}`);

        const tsFileWatcher = tsSysWatchDirectory(
          p,
          (fileName) => {
            logger?.debug(`NODE_SYS_DEBUG::watchDir:callback dir=${p} changedPath=${fileName}`);
            callback(normalizePath(fileName), 'fileUpdate');
          },
          recursive,
        );

        const close = () => {
          tsFileWatcher.close();
        };

        sys.addDestroy(close);

        return {
          close() {
            sys.removeDestroy(close);
            tsFileWatcher.close();
          },
        };
      };

      /**
       * Wrap the TypeScript `watchFile` implementation in order to hook into the rest of the {@link CompilerSystem}
       * implementation that is used when running Stencil's compiler in "watch mode" in Node.
       *
       * The wrapped function calls the default TypeScript `watchFile` implementation for the provided `path`. Based on
       * the type of {@link ts.FileWatcherEventKind} emitted, invoke the provided callback and inform the rest of the
       * `CompilerSystem` that the event occurred.
       *
       * This function does not perform any file watcher registration itself. Each `path` provided to it when called
       * has already been registered as a file to watch.
       *
       * @param path the path to the file that is being watched
       * @param callback a callback to invoke. The same callback is invoked for every `ts.FileWatcherEventKind`, only
       * with a different event classifier string.
       * @returns an object with a method for unhooking the file watcher from the system
       */
      sys.watchFile = (path: string, callback: CompilerFileWatcherCallback): CompilerFileWatcher => {
        logger?.debug(`NODE_SYS_DEBUG::watchFile ${path}`);

        const tsFileWatcher = tsSysWatchFile(
          path,
          (fileName: string, tsEventKind: TypeScript.FileWatcherEventKind) => {
            fileName = normalizePath(fileName);
            if (tsEventKind === ts.FileWatcherEventKind.Created) {
              callback(fileName, 'fileAdd');
              sys.events.emit('fileAdd', fileName);
            } else if (tsEventKind === ts.FileWatcherEventKind.Changed) {
              callback(fileName, 'fileUpdate');
              sys.events.emit('fileUpdate', fileName);
            } else if (tsEventKind === ts.FileWatcherEventKind.Deleted) {
              callback(fileName, 'fileDelete');
              sys.events.emit('fileDelete', fileName);
            }
          },

          /**
           * When setting up a watcher, a numeric polling interval (in milliseconds) must be set when using
           * {@link ts.WatchFileKind.FixedPollingInterval}. Failing to do so may cause the watch process in the
           * TypeScript compiler to crash when files are deleted.
           *
           * This is the value that was used for files in TypeScript 4.8.4. The value is hardcoded as TS does not
           * export this value/make it publicly available.
           */
          250,

          /**
           * As of TypeScript v4.9, the default file watcher implementation is based on file system events, and moves
           * away from the previous polling based implementation. When attempting to use the file system events-based
           * implementation, issues with the dev server (which runs "watch mode") were reported, stating that the
           * compiler was continuously recompiling and reloading the dev server. It was found that in some cases, this
           * would be caused by the access time (`atime`) on a non-TypeScript file being update by some process on the
           * user's machine. For now, we default back to the poll-based implementation to avoid such issues, and will
           * revisit this functionality in the future.
           *
           * Ref: {@link https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#file-watching-now-uses-file-system-events|TS 4.9 Release Note}
           *
           * TODO(STENCIL-744): Revisit using file system events for watch mode
           */
          {
            // TS 4.8 and under defaulted to this type of polling interval for polling-based watchers
            watchFile: ts.WatchFileKind.FixedPollingInterval,
            // set fallbackPolling so that directories are given the correct watcher variant
            fallbackPolling: ts.PollingWatchKind.FixedInterval,
          },
        );

        const close = () => {
          tsFileWatcher.close();
        };
        sys.addDestroy(close);

        return {
          close() {
            sys.removeDestroy(close);
            tsFileWatcher.close();
          },
        };
      };
    },
    stat(p) {
      return new Promise((resolve) => {
        fs.stat(p, (err, fsStat) => {
          if (err) {
            resolve({
              isDirectory: false,
              isFile: false,
              isSymbolicLink: false,
              size: 0,
              mtimeMs: 0,
              error: err,
            });
          } else {
            resolve({
              isDirectory: fsStat.isDirectory(),
              isFile: fsStat.isFile(),
              isSymbolicLink: fsStat.isSymbolicLink(),
              size: fsStat.size,
              mtimeMs: fsStat.mtimeMs,
              error: null,
            });
          }
        });
      });
    },
    statSync(p) {
      try {
        const fsStat = fs.statSync(p);
        return {
          isDirectory: fsStat.isDirectory(),
          isFile: fsStat.isFile(),
          isSymbolicLink: fsStat.isSymbolicLink(),
          size: fsStat.size,
          mtimeMs: fsStat.mtimeMs,
          error: null,
        };
      } catch (e) {
        return {
          isDirectory: false,
          isFile: false,
          isSymbolicLink: false,
          size: 0,
          mtimeMs: 0,
          error: e,
        };
      }
    },
    tmpDirSync() {
      return tmpdir();
    },
    writeFile(p, content) {
      return new Promise((resolve) => {
        fs.writeFile(p, content, (err) => {
          resolve({ path: p, error: err });
        });
      });
    },
    writeFileSync(p, content) {
      const results: CompilerSystemWriteFileResults = {
        path: p,
        error: null,
      };
      try {
        fs.writeFileSync(p, content);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    generateContentHash(content, length) {
      let hash = createHash('sha1').update(content).digest('hex').toLowerCase();
      if (typeof length === 'number') {
        hash = hash.slice(0, length);
      }
      return Promise.resolve(hash);
    },
    generateFileHash(filePath, length) {
      return new Promise((resolve, reject) => {
        const h = createHash('sha1');
        fs.createReadStream(filePath)
          .on('error', (err) => reject(err))
          .on('data', (data) => h.update(data))
          .on('end', () => {
            let hash = h.digest('hex').toLowerCase();
            if (typeof length === 'number') {
              hash = hash.slice(0, length);
            }
            resolve(hash);
          });
      });
    },
    copy: nodeCopyTasks,
    details: {
      cpuModel: (Array.isArray(sysCpus) && sysCpus.length > 0 ? sysCpus[0] && sysCpus[0].model : '') || '',
      freemem() {
        return freemem();
      },
      platform:
        osPlatform === 'darwin' || osPlatform === 'linux' ? osPlatform : osPlatform === 'win32' ? 'windows' : '',
      release: release(),
      totalmem: totalmem(),
    },
  };

  const nodeResolve = new NodeResolveModule();

  sys.lazyRequire = new NodeLazyRequire(nodeResolve, {
    '@types/jest': { minVersion: '24.9.1', recommendedVersion: '29', maxVersion: '29.0.0' },
    jest: { minVersion: '24.9.0', recommendedVersion: '29', maxVersion: '29.0.0' },
    'jest-cli': { minVersion: '24.9.0', recommendedVersion: '29', maxVersion: '29.0.0' },
    puppeteer: { minVersion: '10.0.0', recommendedVersion: '20' },
    'puppeteer-core': { minVersion: '10.0.0', recommendedVersion: '20' },
    'workbox-build': { minVersion: '4.3.1', recommendedVersion: '4.3.1' },
  });

  prcs.on('SIGINT', runInterruptsCallbacks);
  prcs.on('exit', runInterruptsCallbacks);

  return sys;
}
