import { isFunction, normalizePath } from '../../utils';
import { createHash } from 'node:crypto';
import fs from 'graceful-fs';
import { cpus, freemem, platform, release, tmpdir, totalmem } from 'node:os';
import * as os from 'node:os';
import path from 'node:path';
import * as parcelWatcher from '@parcel/watcher';

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
} from '@stencil/core';
import { asyncGlob, nodeCopyTasks } from './node-copy-tasks';
import { NodeLazyRequire } from './node-lazy-require';
import { NodeResolveModule } from './node-resolve-module';
import { checkVersion } from './node-stencil-version-checker';
import { NodeWorkerController } from './node-worker-controller';

const __dirname = import.meta.dirname;

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

  // Note: tsdown bundles this into a chunk at dist/, so __dirname = dist/
  const compilerExecutingPath = path.join(__dirname, 'compiler', 'index.mjs');

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
      const forkModulePath = path.join(__dirname, 'sys', 'node', 'worker.mjs');
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
      process.exitCode = exitCode;
    },
    getCurrentDirectory() {
      return normalizePath(prcs.cwd());
    },
    getCompilerExecutingPath() {
      return compilerExecutingPath;
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
    setupCompiler(_c) {
      sys.watchTimeout = 80;
      sys.events = buildEvents();

      // Track active subscriptions for cleanup
      const activeSubscriptions = new Map<string, Promise<parcelWatcher.AsyncSubscription>>();

      /**
       * Watch a directory for changes using @parcel/watcher.
       * Uses native file system events (FSEvents on macOS, inotify on Linux, ReadDirectoryChangesW on Windows)
       * for efficient, low-latency change detection.
       */
      sys.watchDirectory = (p, callback, _recursive) => {
        logger?.debug(`NODE_SYS_DEBUG::watchDir ${p}`);

        const subscriptionPromise = parcelWatcher
          .subscribe(
            p,
            (err, events) => {
              if (err) {
                logger?.error(`Watch error for ${p}: ${err.message}`);
                return;
              }
              for (const event of events) {
                const fileName = normalizePath(event.path);
                logger?.debug(`NODE_SYS_DEBUG::watchDir:callback dir=${p} changedPath=${fileName} type=${event.type}`);

                // Map @parcel/watcher event types to Stencil's event types
                if (event.type === 'create') {
                  callback(fileName, 'fileAdd');
                } else if (event.type === 'update') {
                  callback(fileName, 'fileUpdate');
                } else if (event.type === 'delete') {
                  callback(fileName, 'fileDelete');
                }
              }
            },
            {
              ignore: ['.git', 'node_modules', '.stencil', 'dist', 'www', '.cache'],
            },
          )
          .catch((err) => {
            // Directory may not exist yet - this is expected during initial builds
            logger?.debug(`Watch subscribe failed for ${p}: ${err.message}`);
            return null;
          });

        activeSubscriptions.set(p, subscriptionPromise as Promise<parcelWatcher.AsyncSubscription>);

        const close = () => {
          const sub = activeSubscriptions.get(p);
          if (sub) {
            activeSubscriptions.delete(p);
            sub.then((s) => s?.unsubscribe()).catch(() => {});
          }
        };

        sys.addDestroy(close);

        return {
          close() {
            sys.removeDestroy(close);
            close();
          },
        };
      };

      /**
       * Watch an individual file for changes using @parcel/watcher.
       * Watches the parent directory and filters events for the specific file.
       */
      sys.watchFile = (filePath: string, callback: CompilerFileWatcherCallback): CompilerFileWatcher => {
        logger?.debug(`NODE_SYS_DEBUG::watchFile ${filePath}`);

        const normalizedPath = normalizePath(filePath);
        const dirPath = path.dirname(filePath);

        const subscriptionPromise = parcelWatcher
          .subscribe(
            dirPath,
            (err, events) => {
              if (err) {
                logger?.error(`Watch error for ${filePath}: ${err.message}`);
                return;
              }
              for (const event of events) {
                const eventPath = normalizePath(event.path);
                // Only process events for the specific file we're watching
                if (eventPath === normalizedPath) {
                  logger?.debug(`NODE_SYS_DEBUG::watchFile:callback file=${filePath} type=${event.type}`);

                  if (event.type === 'create') {
                    callback(eventPath, 'fileAdd');
                    sys.events.emit('fileAdd', eventPath);
                  } else if (event.type === 'update') {
                    callback(eventPath, 'fileUpdate');
                    sys.events.emit('fileUpdate', eventPath);
                  } else if (event.type === 'delete') {
                    callback(eventPath, 'fileDelete');
                    sys.events.emit('fileDelete', eventPath);
                  }
                }
              }
            },
            {
              ignore: ['.git', 'node_modules'],
            },
          )
          .catch((err) => {
            // Directory may not exist yet - this is expected for files being watched before creation
            logger?.debug(`Watch subscribe failed for ${filePath}: ${err.message}`);
            return null;
          });

        const subscriptionKey = `file:${filePath}`;
        activeSubscriptions.set(subscriptionKey, subscriptionPromise as Promise<parcelWatcher.AsyncSubscription>);

        const close = () => {
          const sub = activeSubscriptions.get(subscriptionKey);
          if (sub) {
            activeSubscriptions.delete(subscriptionKey);
            sub.then((s) => s?.unsubscribe()).catch(() => {});
          }
        };

        sys.addDestroy(close);

        return {
          close() {
            sys.removeDestroy(close);
            close();
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
