import type * as d from '@stencil/core/internal';
import { isIterable, isString, normalizePath, relative } from '@utils';
import { basename, dirname } from 'path';

/**
 * An in-memory FS which proxies the underlying OS filesystem using a simple
 * in-memory cache. FS writes can accumulate on the in-memory system, using an
 * API similar to Node.js' `"fs"` module, and then be committed to disk as a
 * unit.
 *
 * Files written to the in-memory system can be edited, deleted, and so on.
 * This allows the compiler to proceed freely as if it is modifying the
 * filesystem, modifying the world in whatever way suits it, while deferring
 * actual FS writes until the end of the compilation process, making actual
 * changes to the filesystem on disk contingent on an error-free build or any
 * other condition.
 *
 * Usage example:
 *
 * ```ts
 * // create an in-memory FS
 * const sys = createSystem();
 * const inMemoryFs = createInMemoryFs(sys);
 *
 * // do a few fs operations
 * await inMemoryFs.writeFile("path/to/file.js", 'console.log("hey!");')
 * await inMemoryFs.remove("path/to/another_file.ts");
 *
 * // commit the results to disk
 * const commitStats = await inMemoryFs.commit();
 * ```
 *
 * In the above example the write operation and the delete operation (w/
 * `.remove`) are both queued in the in-memory proxy but not committed to
 * disk until the `.commit` method is called.
 */
export type InMemoryFileSystem = ReturnType<typeof createInMemoryFs>;

/**
 * A node in the in-memory file system. This may represent a file or
 * a directory, and pending copy, write, and delete operations may be stored
 * on it.
 */
export interface FsItem {
  fileText: string;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtimeMs: number;
  exists: boolean;
  queueCopyFileToDest: string;
  queueWriteToDisk: boolean;
  queueDeleteFromDisk?: boolean;
  useCache: boolean;
}

/**
 * Storage format for the in-memory cache used to proxy the OS filesystem.
 *
 * Filesystem paths (of type `string`) are mapped to objects satisfying the
 * `FsItem` interface.
 */
export type FsItems = Map<string, FsItem>;

/**
 * Options supported by write methods on the in-memory filesystem.
 */
export interface FsWriteOptions {
  /**
   * only use the in-memory cache and do not write the file to disk
   */
  inMemoryOnly?: boolean;
  clearFileCache?: boolean;
  /**
   * flush the write to disk immediately, skipping the in-memory cache
   */
  immediateWrite?: boolean;
  /**
   * specify that the cache should be used
   */
  useCache?: boolean;
  /**
   * An optional tag for the current output target for which this file is being
   * written.
   */
  outputTargetType?: string;
}

/**
 * Results from a write operation on the in-memory filesystem.
 */
export interface FsWriteResults {
  changedContent: boolean;
  queuedWrite: boolean;
  ignored: boolean;
}

/**
 * Options supported by read methods on the in-memory filesystem.
 */
export interface FsReadOptions {
  useCache?: boolean;
  setHash?: boolean;
}

/**
 * Options supported by the readdir option on the in-memory filesystem.
 */
interface FsReaddirOptions {
  inMemoryOnly?: boolean;
  recursive?: boolean;
  /**
   * Directory names to exclude. Just the basename,
   * not the entire path. Basically for "node_modules".
   */
  excludeDirNames?: string[];
  /**
   * Extensions we know we can avoid. Each extension
   * should include the `.` so that we can test for both
   * `.d.ts.` and `.ts`. If `excludeExtensions` isn't provided it
   * doesn't try to exclude anything. This only checks against
   * the filename, not directory names when recursive.
   */
  excludeExtensions?: string[];
}

/**
 * A result from a directory read operation
 */
interface FsReaddirItem {
  absPath: string;
  relPath: string;
  isDirectory: boolean;
  isFile: boolean;
}

/**
 * Information about a file in the in-memory filesystem.
 */
interface FsStat {
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  size: number;
}

/**
 * Create an in-memory FS which proxies the underlying OS filesystem using an
 * in-memory cache. FS writes can accumulate on the in-memory system, using an
 * API similar to Node.js' `"fs"` module, and then be committed to disk as a
 * unit.
 *
 * Files written to the in-memory system can be edited, deleted, and so on.
 * This allows the compiler to proceed freely as if it is modifying the
 * filesystem, modifying the world in whatever way suits it, while deferring
 * actual FS writes until the end of the compilation process, making actual
 * changes to the filesystem on disk contingent on an error-free build or any
 * other condition.
 *
 * @param sys a compiler system object
 * @returns an in-memory filesystem interface
 */
export const createInMemoryFs = (sys: d.CompilerSystem) => {
  /**
   * Map to hold the items in the in-memory cache which proxies the underlying
   * OS filesystem.
   */
  const items: FsItems = new Map();
  const outputTargetTypes = new Map<string, string>();

  /**
   * Check if a file exists at a provided path. This function will attempt to
   * use the in-memory cache before performing a blocking read. In the event of
   * a cache hit, the content from the cache will be returned and the read skipped.
   *
   * @param filePath the path to the file to read
   * @returns `true` if the file exists, `false` otherwise
   */
  const access = async (filePath: string): Promise<boolean> => {
    const item = getItem(filePath);

    if (typeof item.exists !== 'boolean') {
      const stats = await stat(filePath);
      return stats.exists;
    }
    return item.exists;
  };

  /**
   * **Synchronous!!! Do not use!!!**
   * (Only typescript transpiling is allowed to use)
   *
   * Synchronously get information about a file from a provided path. This
   * function will attempt to use an in-memory cache before performing a
   * blocking read.
   *
   * In the event of a cache hit, the content from the cache will be returned
   * and skip the read.
   *
   * @param filePath the path to the file to read
   * @returns `true` if the file exists, `false` otherwise
   */
  const accessSync = (filePath: string): boolean => {
    const item = getItem(filePath);
    if (typeof item.exists !== 'boolean') {
      const stats = statSync(filePath);
      return stats.exists;
    }
    return item.exists;
  };

  /**
   * Copy a file from `src` to `dest`. Note that this merely queues the file
   * for copying, the copy isn't actually committed.
   *
   * @param src the path to the source file
   * @param dest the destination the source file should be copied to
   */
  const copyFile = async (src: string, dest: string): Promise<void> => {
    const item = getItem(src);
    item.queueCopyFileToDest = dest;
  };

  /**
   * Empty a series of directories of their contents
   *
   * @param dirs a set of directories to empty
   * @returns an empty Promise
   */
  const emptyDirs = async (dirs: string[]): Promise<void> => {
    dirs = dirs
      .filter(isString)
      .map((s) => normalizePath(s))
      .reduce((dirs, dir) => {
        if (!dirs.includes(dir)) {
          dirs.push(dir);
        }
        return dirs;
      }, [] as string[]);

    const allFsItems = await Promise.all(dirs.map((dir) => readdir(dir, { recursive: true })));
    const reducedItems: string[] = [];

    for (const fsItems of allFsItems) {
      for (const f of fsItems) {
        if (!reducedItems.includes(f.absPath)) {
          reducedItems.push(f.absPath);
        }
      }
    }

    reducedItems.sort((a, b) => {
      const partsA = a.split('/').length;
      const partsB = b.split('/').length;
      if (partsA < partsB) return 1;
      if (partsA > partsB) return -1;
      return 0;
    });

    await Promise.all(reducedItems.map(removeItem));

    dirs.forEach((dir) => {
      const item = getItem(dir);
      item.isFile = false;
      item.isDirectory = true;
      item.queueWriteToDisk = true;
      item.queueDeleteFromDisk = false;
    });
  };

  /**
   * Get the contents of a directory on the in-memory filesystem
   *
   * @param dirPath the path to the directory of interest
   * @param opts an optional object containing configuration options
   * @returns a Promise wrapping a list of directory contents
   */
  const readdir = async (dirPath: string, opts: FsReaddirOptions = {}): Promise<FsReaddirItem[]> => {
    dirPath = normalizePath(dirPath);

    const collectedPaths: FsReaddirItem[] = [];

    if (opts.inMemoryOnly === true) {
      let inMemoryDir = dirPath;
      if (!inMemoryDir.endsWith('/')) {
        inMemoryDir += '/';
      }

      const inMemoryDirs = dirPath.split('/');

      items.forEach((dir, filePath) => {
        if (!filePath.startsWith(dirPath)) {
          return;
        }

        const parts = filePath.split('/');

        if (parts.length === inMemoryDirs.length + 1 || (opts.recursive && parts.length > inMemoryDirs.length)) {
          if (dir.exists) {
            const item: FsReaddirItem = {
              absPath: filePath,
              relPath: parts[inMemoryDirs.length],
              isDirectory: dir.isDirectory,
              isFile: dir.isFile,
            };
            if (!shouldExcludeFromReaddir(opts, item)) {
              collectedPaths.push(item);
            }
          }
        }
      });
    } else {
      // always a disk read
      await readDirectory(dirPath, dirPath, opts, collectedPaths);
    }

    return collectedPaths.sort((a, b) => {
      if (a.absPath < b.absPath) return -1;
      if (a.absPath > b.absPath) return 1;
      return 0;
    });
  };

  /**
   * A directory read function which _always_ reads from the disk and so is
   * only used internally.
   *
   * @param initPath an initial path used for computing relative paths
   * @param dirPath the path of the directory to look at
   * @param opts options for read operations
   * @param collectedPaths an out param to which directory entries will be
   * added
   */
  const readDirectory = async (
    initPath: string,
    dirPath: string,
    opts: FsReaddirOptions,
    collectedPaths: FsReaddirItem[],
  ) => {
    // used internally only so we could easily recursively drill down
    // loop through this directory and sub directories
    // always a disk read!!removeDir
    const dirItems = await sys.readDir(dirPath);
    if (dirItems.length > 0) {
      // cache some facts about this path
      const item = getItem(dirPath);
      item.exists = true;
      item.isFile = false;
      item.isDirectory = true;

      await Promise.all(
        dirItems.map(async (dirItem) => {
          // let's loop through each of the files we've found so far
          // create an absolute path of the item inside of this directory
          const absPath = normalizePath(dirItem);
          const relPath = normalizePath(relative(initPath, absPath));

          // get the fs stats for the item, could be either a file or directory
          const stats = await stat(absPath);

          const childItem: FsReaddirItem = {
            absPath: absPath,
            relPath: relPath,
            isDirectory: stats.isDirectory,
            isFile: stats.isFile,
          };

          if (shouldExcludeFromReaddir(opts, childItem)) {
            return;
          }

          collectedPaths.push(childItem);

          if (opts.recursive === true && stats.isDirectory === true) {
            // looks like it's yet another directory
            // let's keep drilling down
            await readDirectory(initPath, absPath, opts, collectedPaths);
          }
        }),
      );
    }
  };

  /**
   * Check whether a given item should be excluded from readdir results
   *
   * @param opts options for fs read operations
   * @param item the item in question
   * @returns whether the item should be excluded or not
   */
  const shouldExcludeFromReaddir = (opts: FsReaddirOptions, item: FsReaddirItem) => {
    if (item.isDirectory) {
      if (Array.isArray(opts.excludeDirNames)) {
        const base = basename(item.absPath);
        if (opts.excludeDirNames.some((dir) => base === dir)) {
          return true;
        }
      }
    } else {
      if (Array.isArray(opts.excludeExtensions)) {
        const p = item.relPath.toLowerCase();
        if (opts.excludeExtensions.some((ext) => p.endsWith(ext))) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * Read a file on the in-memory filesystem. By default, this will look at
   * the in-memory FS proxy first and then, if nothing is found at the provided
   * path, it will then look at the real FS.
   *
   * This behavior can be disabled by setting the `useCache` option to `false`
   * on the provided options object. When this option is set the actual FS will
   * be checked directly without looking at the in-memory FS first.
   *
   * @param filePath the filepath of interest
   * @param opts an optional object containing options for reading files
   * @returns a promise wrapping either the contents of the file (if found) or
   * undefined if it's not found
   */
  const readFile = async (filePath: string, opts?: FsReadOptions) => {
    // default to looking at the in-memory FS first (we will only *not* do
    // so if `opts.useCache === false`)
    if (opts == null || opts.useCache === true || opts.useCache === undefined) {
      const item = getItem(filePath);
      if (item.exists && typeof item.fileText === 'string') {
        return item.fileText;
      }
    }

    const fileText = await sys.readFile(filePath);
    const item = getItem(filePath);
    if (typeof fileText === 'string') {
      if (fileText.length < MAX_TEXT_CACHE) {
        item.exists = true;
        item.isFile = true;
        item.isDirectory = false;
        item.fileText = fileText;
      }
    } else {
      item.exists = false;
    }
    return fileText;
  };

  /**
   * **Synchronous!!! Do not use!!!**
   * (Only typescript transpiling is allowed to use)
   *
   * Synchronously read a file from a provided path. This function will attempt
   * to use an in-memory cache before performing a blocking read in the
   * following circumstances:
   *
   * - no `opts` are provided
   * - the `useCache` member on `opts` is set to `true`, or is not set
   *
   * In the event of a cache hit, the content from the cache will be returned
   * and skip the read.
   *
   * @param filePath the path to the file to read
   * @param opts a configuration to use when reading a file
   * @returns the contents of the file (read from either disk or the cache).
   */
  const readFileSync = (filePath: string, opts?: FsReadOptions): string => {
    if (opts == null || opts.useCache === true || opts.useCache === undefined) {
      const item = getItem(filePath);
      if (item.exists && typeof item.fileText === 'string') {
        return item.fileText;
      }
    }

    const fileText = sys.readFileSync(filePath);
    const item = getItem(filePath);
    if (typeof fileText === 'string') {
      if (fileText.length < MAX_TEXT_CACHE) {
        item.exists = true;
        item.isFile = true;
        item.isDirectory = false;
        item.fileText = fileText;
      }
    } else {
      item.exists = false;
    }

    return fileText;
  };

  /**
   * Remove an item from the in-memory FS
   *
   * This is done by marking it for deletion. The item will remain in memory
   * until the queued changes are committed. This function handles both files
   * and directories.
   *
   * @param itemPath the path to the item to be deleted
   * @returns an empty promise
   */
  const remove = async (itemPath: string): Promise<void> => {
    const stats = await stat(itemPath);

    if (stats.isDirectory === true) {
      await removeDir(itemPath);
    } else if (stats.isFile === true) {
      await removeItem(itemPath);
    }
  };

  /**
   * Remove an item from the in-memory FS by marking it to be deleted
   *
   * @param dirPath the path to the item to be deleted
   * @returns an empty promise
   */
  const removeDir = async (dirPath: string): Promise<void> => {
    const item = getItem(dirPath);
    item.isFile = false;
    item.isDirectory = true;
    if (!item.queueWriteToDisk) {
      item.queueDeleteFromDisk = true;
    }

    try {
      const dirItems = await readdir(dirPath, { recursive: true });

      await Promise.all(
        dirItems.map((item) => {
          if (item.relPath.endsWith('.gitkeep')) {
            return null;
          }
          return removeItem(item.absPath);
        }),
      );
    } catch (e) {
      // do not throw error if the directory never existed
    }
  };

  /**
   * Remove an item from the in-memory FS by marking it to be deleted
   *
   * @param filePath the path to the item to be deleted
   * @returns an empty promise
   */
  const removeItem = async (filePath: string): Promise<void> => {
    const item = getItem(filePath);
    if (!item.queueWriteToDisk) {
      item.queueDeleteFromDisk = true;
    }
  };

  /**
   * Get statistics and information about a filepath in the in-memory FS.
   *
   * This function is fairly similar to the `stat` function in node's
   * `fs` module. If an item exists at the path in question this will return
   * information including whether it's a file or a directory, filesize, etc.
   * If it does not exist the `exists` property will be set accordingly.
   *
   * @param itemPath the path to the item in question
   * @returns a Promise wrapping an object with information about the item
   */
  const stat = async (itemPath: string): Promise<FsStat> => {
    const item = getItem(itemPath);

    if (typeof item.isDirectory !== 'boolean' || typeof item.isFile !== 'boolean') {
      const stat = await sys.stat(itemPath);
      if (!stat.error) {
        item.exists = true;
        if (stat.isFile) {
          item.isFile = true;
          item.isDirectory = false;
          item.size = stat.size;
        } else if (stat.isDirectory) {
          item.isFile = false;
          item.isDirectory = true;
          item.size = stat.size;
        } else {
          item.isFile = false;
          item.isDirectory = false;
          item.size = null;
        }
      } else {
        item.exists = false;
      }
    }

    return {
      exists: !!item.exists,
      isFile: !!item.isFile,
      isDirectory: !!item.isDirectory,
      size: typeof item.size === 'number' ? item.size : 0,
    };
  };

  /**
   * **Synchronous!!! Do not use!!!**
   * (Only typescript transpiling is allowed to use)
   *
   * Searches an in-memory cache for an item at the provided path. Always
   * returns an object, **does not throw errors**.
   *
   * @param itemPath the path to the file to read
   * @returns an object describing the item found at the provided `itemPath`
   */
  const statSync = (itemPath: string): FsStat => {
    const item = getItem(itemPath);
    if (typeof item.isDirectory !== 'boolean' || typeof item.isFile !== 'boolean') {
      const stat = sys.statSync(itemPath);
      if (!stat.error) {
        item.exists = true;
        if (stat.isFile) {
          item.isFile = true;
          item.isDirectory = false;
          item.size = stat.size;
        } else if (stat.isDirectory) {
          item.isFile = false;
          item.isDirectory = true;
          item.size = stat.size;
        } else {
          item.isFile = false;
          item.isDirectory = false;
          item.size = null;
        }
      } else {
        item.exists = false;
      }
    }

    return {
      exists: !!item.exists,
      isFile: !!item.isFile,
      isDirectory: !!item.isDirectory,
      size: item.size,
    };
  };

  /**
   * Write a file to the in-memory filesystem. The behavior of this function
   * can be modified in several ways by passing different parameters in the
   * options object.
   *
   * Supported options and their effects:
   *
   * - `useCache`: specify that the cache should be used
   * - `inMemoryOnly`: only use the in-memory cache and do not write the file
   *   to disk
   * - `immediateWrite`: flush the write to disk immediately, skipping the
   *   in-memory cache
   *
   * This function will additionally check before it writes anything to disk
   * to see if the content to be written is different than what already exists
   * on disk.
   *
   * @param filePath the filePath to write to
   * @param content what to write!
   * @param opts an optional object which controls how the file is written
   * @returns a Promise wrapping a write result object
   */
  const writeFile = async (filePath: string, content: string, opts?: FsWriteOptions): Promise<FsWriteResults> => {
    if (typeof filePath !== 'string') {
      throw new Error(`writeFile, invalid filePath: ${filePath}`);
    }

    if (typeof content !== 'string') {
      throw new Error(`writeFile, invalid content: ${filePath}`);
    }

    const results: FsWriteResults = {
      ignored: false,
      changedContent: false,
      queuedWrite: false,
    };

    if (shouldIgnore(filePath) === true) {
      results.ignored = true;
      return results;
    }

    const item = getItem(filePath);
    item.exists = true;
    item.isFile = true;
    item.isDirectory = false;
    item.queueDeleteFromDisk = false;

    if (typeof item.fileText === 'string') {
      // compare strings but replace Windows CR to rule out any
      // insignificant new line differences
      results.changedContent = item.fileText.replace(/\r/g, '') !== content.replace(/\r/g, '');
    } else {
      results.changedContent = true;
    }
    item.fileText = content;

    results.queuedWrite = false;

    if (opts != null) {
      if (typeof opts.outputTargetType === 'string') {
        outputTargetTypes.set(filePath, opts.outputTargetType);
      }
      if (opts.useCache === false) {
        item.useCache = false;
      }
    }

    if (opts != null && opts.inMemoryOnly === true) {
      // we don't want to actually write this to disk
      // just keep it in memory
      if (item.queueWriteToDisk) {
        // we already queued this file to write to disk
        // in that case we still need to do it
        results.queuedWrite = true;
      } else {
        // we only want this in memory and
        // it wasn't already queued to be written
        item.queueWriteToDisk = false;
      }

      // ensure in-memory directories are created
      await ensureDir(filePath, true);
    } else if (opts != null && opts.immediateWrite === true) {
      // if this is an immediate write then write the file
      // now and do not add it to the queue
      if (results.changedContent || opts.useCache !== true) {
        // writing the file to disk is a big deal and kicks off fs watchers
        // so let's just double check that the file is actually different first
        const existingFile = await sys.readFile(filePath);
        if (typeof existingFile === 'string') {
          results.changedContent = item.fileText.replace(/\r/g, '') !== existingFile.replace(/\r/g, '');
        }

        if (results.changedContent) {
          await ensureDir(filePath, false);
          const { error } = await sys.writeFile(filePath, item.fileText);
          if (error) {
            throw error;
          }
        }
      }
    } else {
      // we want to write this to disk (eventually)
      // but only if the content is different
      // from our existing cached content
      if (!item.queueWriteToDisk && results.changedContent === true) {
        // not already queued to be written
        // and the content is different
        item.queueWriteToDisk = true;
        results.queuedWrite = true;
      }
    }

    return results;
  };

  /**
   * Write a series of files to the in-memory filesystem
   *
   * @param files a data structure mapping filepath -> content
   * @param opts an optional set of options passed to `writeFile`
   * @returns a Promise wrapping all write result objects for all the files
   */
  const writeFiles = (files: { [filePath: string]: string } | Map<string, string>, opts?: FsWriteOptions) => {
    const writes: Promise<FsWriteResults>[] = [];

    if (isIterable(files)) {
      files.forEach((content, filePath) => {
        writes.push(writeFile(filePath, content, opts));
      });
    } else {
      Object.keys(files).map((filePath) => {
        writes.push(writeFile(filePath, files[filePath], opts));
      });
    }

    return Promise.all(writes);
  };

  /**
   * Commit all pending FS operations to disk
   *
   * FS operations like writes, copies, and deletes which are done to the
   * in-memory FS are deferred and only recorded in the in-memory cache. This
   * method takes all of the deferred FS actions and commits them to the FS,
   * writing and copying files, creating directories, etc.
   *
   * @returns a Promise wrapping a summary of what was done
   */
  const commit = async (): Promise<FsCommitResults> => {
    const instructions = getCommitInstructions(items);

    // ensure directories we need exist
    const dirsAdded = await commitEnsureDirs(instructions.dirsToEnsure, false);

    // write all queued the files
    const filesWritten = await commitWriteFiles(instructions.filesToWrite);

    // write all queued the files to copy
    const filesCopied = await commitCopyFiles(instructions.filesToCopy);

    // remove all the queued files to be deleted
    const filesDeleted = await commitDeleteFiles(instructions.filesToDelete);

    // remove all the queued dirs to be deleted
    const dirsDeleted = await commitDeleteDirs(instructions.dirsToDelete);

    instructions.filesToDelete.forEach(clearFileCache);

    instructions.dirsToDelete.forEach(clearDirCache);

    // return only the files that were
    return {
      filesCopied,
      filesWritten,
      filesDeleted,
      dirsDeleted,
      dirsAdded,
    };
  };

  /**
   * Ensure that a directory exists
   *
   * @param path the path to ensure exists
   * @param inMemoryOnly don't commit any changes to the filesystem, instead
   * only change the in-memory cache
   */
  const ensureDir = async (path: string, inMemoryOnly: boolean) => {
    /**
     * in case we write to disk immediately, there is no need to split
     * all directories into separate calls, we can just use the recursive flag
     */
    if (!inMemoryOnly) {
      await sys.createDir(dirname(path), { recursive: true });
      return;
    }

    const allDirs: string[] = [];

    while (true) {
      path = dirname(path);
      if (
        typeof path === 'string' &&
        path.length > 0 &&
        path !== '/' &&
        path.endsWith(':/') === false &&
        path.endsWith(':\\') === false
      ) {
        allDirs.push(path);
      } else {
        break;
      }
    }

    allDirs.reverse();

    await commitEnsureDirs(allDirs, inMemoryOnly);
  };

  /**
   * Ensure that a series of directories are created.
   *
   * If `inMemoryOnly` is true this will not touch the disk but will only
   * modify the in-memory filesystem cache. Otherwise it will create directories
   * in the real FS.
   *
   * @param dirsToEnsure directories we want to ensure exist
   * @param inMemoryOnly whether directory creation should be confined to the
   * in-memory cache
   * @returns a Promise wrapping a list of directories created
   */
  const commitEnsureDirs = async (dirsToEnsure: string[], inMemoryOnly: boolean): Promise<string[]> => {
    const dirsAdded: string[] = [];

    for (const dirPath of dirsToEnsure) {
      const item = getItem(dirPath);

      if (item.exists === true && item.isDirectory === true) {
        // already cached that this path is indeed an existing directory
        continue;
      }

      try {
        // cache that we know this is a directory on disk
        item.exists = true;
        item.isDirectory = true;
        item.isFile = false;

        if (!inMemoryOnly) {
          await sys.createDir(dirPath);
        }

        dirsAdded.push(dirPath);
      } catch (e) {}
    }

    return dirsAdded;
  };

  /**
   * Commit copy file operations to disk
   *
   * @param filesToCopy a list of [src, dest] tuples
   * @returns an array of copied file types
   */
  const commitCopyFiles = (filesToCopy: FileCopyTuple[]): Promise<FileCopyTuple[]> => {
    const copiedFiles = Promise.all(
      filesToCopy.map(async (data): Promise<FileCopyTuple> => {
        const [src, dest] = data;
        await sys.copyFile(src, dest);
        return [src, dest];
      }),
    );
    return copiedFiles;
  };

  /**
   * Commit file write operations to disk
   *
   * @param filesToWrite a list of files to write
   * @returns a Promise wrapping the files written
   *
   */
  const commitWriteFiles = (filesToWrite: string[]): Promise<string[]> => {
    const writtenFiles = Promise.all(
      filesToWrite.map(async (filePath) => {
        if (typeof filePath !== 'string') {
          throw new Error(`unable to writeFile without filePath`);
        }
        return commitWriteFile(filePath);
      }),
    );
    return writtenFiles;
  };

  /**
   * Commit a file write operation to disk
   *
   * @param filePath the filepath to write
   * @returns a Promise wrapping the written path
   */
  const commitWriteFile = async (filePath: string): Promise<string> => {
    const item = getItem(filePath);

    if (item.fileText == null) {
      throw new Error(`unable to find item fileText to write: ${filePath}`);
    }
    await sys.writeFile(filePath, item.fileText);

    if (item.useCache === false) {
      clearFileCache(filePath);
    }

    return filePath;
  };

  /**
   * Commit file delete operations to disk
   *
   * @param filesToDelete a set of files to delete
   * @returns a Promise wrapping the set of files deleted
   */
  const commitDeleteFiles = async (filesToDelete: string[]): Promise<string[]> => {
    const deletedFiles = await Promise.all(
      filesToDelete.map(async (filePath) => {
        if (typeof filePath !== 'string') {
          throw new Error(`unable to unlink without filePath`);
        }
        await sys.removeFile(filePath);
        return filePath;
      }),
    );
    return deletedFiles;
  };

  /**
   * Commit directory delete operations to disk
   *
   * @param dirsToDelete a set of directories to delete
   * @returns a Promise wrapping the set of directories deleted
   */
  const commitDeleteDirs = async (dirsToDelete: string[]): Promise<string[]> => {
    const dirsDeleted: string[] = [];

    for (const dirPath of dirsToDelete) {
      await sys.removeDir(dirPath);
      dirsDeleted.push(dirPath);
    }

    return dirsDeleted;
  };

  /**
   * Clear all items within a given dir from the in-memory FS cache
   *
   * @param dirPath the path for the item to remove
   */
  const clearDirCache = (dirPath: string) => {
    dirPath = normalizePath(dirPath);

    items.forEach((_, f) => {
      const filePath = relative(dirPath, f).split('/')[0];
      if (!filePath.startsWith('.') && !filePath.startsWith('/')) {
        clearFileCache(f);
      }
    });
  };

  /**
   * Remove an item from the in-memory FS cache, checking first that it is
   * not currently queued for a write operation.
   *
   * @param filePath the path for the item to remove
   */
  const clearFileCache = (filePath: string) => {
    filePath = normalizePath(filePath);
    const item = items.get(filePath);
    if (item != null && !item.queueWriteToDisk) {
      items.delete(filePath);
    }
  };

  /**
   * Cancel pending delete operations on files cached in the in-memory FS.
   * This will not reverse a delete operation if it has already been committed
   * to disk, but will cancel any pending delete operations that have not yet
   * been committed.
   *
   * Note that this will silently **not cancel delete operations on directories**!
   *
   * @param filePaths a list of filepaths which should not be deleted
   */
  const cancelDeleteFilesFromDisk = (filePaths: string[]) => {
    for (const filePath of filePaths) {
      const item = getItem(filePath);
      if (item.isFile === true && item.queueDeleteFromDisk === true) {
        item.queueDeleteFromDisk = false;
      }
    }
  };

  /**
   * Cancel a pending delete operations on directories cached in the in-memory
   * FS. This will not reverse a delete operation if it has already been
   * committed to disk, but will cancel any pending delete operations that
   * have not yet been committed.
   *
   * @param dirPaths a list of filepaths whose delete ops should be canceled
   */
  const cancelDeleteDirectoriesFromDisk = (dirPaths: string[]) => {
    for (const dirPath of dirPaths) {
      const item = getItem(dirPath);
      if (item.queueDeleteFromDisk === true) {
        item.queueDeleteFromDisk = false;
      }
    }
  };

  /**
   * Getter method for the in-memory FS cache / proxy.
   *
   * This will return an item if found or, if it's not present in the cache,
   * will create an 'empty' filesystem item and set it in the cache.
   *
   * @param itemPath the filepath for the item in question
   * @returns an object with information about the item in question
   */
  const getItem = (itemPath: string): FsItem => {
    itemPath = normalizePath(itemPath);
    let item = items.get(itemPath);
    if (item != null) {
      return item;
    }

    items.set(
      itemPath,
      (item = {
        exists: null,
        fileText: null,
        size: null,
        mtimeMs: null,
        isDirectory: null,
        isFile: null,
        queueCopyFileToDest: null,
        queueDeleteFromDisk: null,
        queueWriteToDisk: null,
        useCache: null,
      }),
    );
    return item;
  };

  /**
   * Clear all items out of the in-memory cache
   */
  const clearCache = () => {
    items.clear();
  };

  /**
   * Get some very basic usage statistics for the in-memory cache
   *
   * @returns a formatted description of cache usage
   */
  const getMemoryStats = () => `data length: ${items.size}`;

  /**
   * Get information about the files built for output type
   *
   * @returns a list of build output records
   */
  const getBuildOutputs = (): d.BuildOutput[] => {
    const outputs: d.BuildOutput[] = [];

    outputTargetTypes.forEach((outputTargetType, filePath) => {
      const output = outputs.find((o) => o.type === outputTargetType);
      if (output) {
        output.files.push(filePath);
      } else {
        outputs.push({
          type: outputTargetType,
          files: [filePath],
        });
      }
    });

    outputs.forEach((output) => output.files.sort());

    return outputs.sort((a, b) => {
      if (a.type < b.type) return -1;
      if (a.type > b.type) return 1;
      return 0;
    });
  };

  // only cache if it's less than 5MB-ish (using .length as a rough guess)
  // why 5MB? idk, seems like a good number for source text
  // it's pretty darn large to cover almost ALL legitimate source files
  // and anything larger is probably a REALLY large file and a rare case
  // which we don't need to eat up memory for
  const MAX_TEXT_CACHE = 5242880;

  return {
    access,
    accessSync,
    cancelDeleteDirectoriesFromDisk,
    cancelDeleteFilesFromDisk,
    clearCache,
    clearDirCache,
    clearFileCache,
    commit,
    copyFile,
    emptyDirs,
    getBuildOutputs,
    getItem,
    getMemoryStats,
    readFile,
    readFileSync,
    readdir,
    remove,
    stat,
    statSync,
    sys,
    writeFile,
    writeFiles,
  };
};

/**
 * The information needed to carry out a file copy operation.
 *
 * `[ source, destination ]`
 */
type FileCopyTuple = [string, string];

/**
 * Collected instructions for all pending filesystem operations saved
 * to the in-memory filesystem.
 */
interface FsCommitInstructions {
  filesToDelete: string[];
  filesToWrite: string[];
  /**
   * Files queued for copy operations are stored as an array of `[source, dest]`
   * tuples.
   */
  filesToCopy: FileCopyTuple[];
  dirsToDelete: string[];
  dirsToEnsure: string[];
}

/**
 * Results from committing pending filesystem operations
 */
interface FsCommitResults {
  filesCopied: FileCopyTuple[];
  filesWritten: string[];
  filesDeleted: string[];
  dirsDeleted: string[];
  dirsAdded: string[];
}

/**
 * Given the current state of the in-memory proxy filesystem, collect all of
 * the changes that need to be made in order to commit the currently-pending
 * operations (e.g. write, copy, delete) to the OS filesystem.
 *
 * @param items the storage data structure for the in-memory FS cache
 * @returns a collection of all the operations that need to be done
 */
export const getCommitInstructions = (items: FsItems): FsCommitInstructions => {
  const instructions: FsCommitInstructions = {
    filesToDelete: [],
    filesToWrite: [],
    filesToCopy: [],
    dirsToDelete: [],
    dirsToEnsure: [],
  };

  items.forEach((item, itemPath) => {
    if (item.queueWriteToDisk === true) {
      if (item.isFile === true) {
        instructions.filesToWrite.push(itemPath);

        const dir = normalizePath(dirname(itemPath));
        if (!instructions.dirsToEnsure.includes(dir)) {
          instructions.dirsToEnsure.push(dir);
        }

        const dirDeleteIndex = instructions.dirsToDelete.indexOf(dir);
        if (dirDeleteIndex > -1) {
          instructions.dirsToDelete.splice(dirDeleteIndex, 1);
        }

        const fileDeleteIndex = instructions.filesToDelete.indexOf(itemPath);
        if (fileDeleteIndex > -1) {
          instructions.filesToDelete.splice(fileDeleteIndex, 1);
        }
      } else if (item.isDirectory === true) {
        if (!instructions.dirsToEnsure.includes(itemPath)) {
          instructions.dirsToEnsure.push(itemPath);
        }

        const dirDeleteIndex = instructions.dirsToDelete.indexOf(itemPath);
        if (dirDeleteIndex > -1) {
          instructions.dirsToDelete.splice(dirDeleteIndex, 1);
        }
      }
    } else if (item.queueDeleteFromDisk === true) {
      if (item.isDirectory && !instructions.dirsToEnsure.includes(itemPath)) {
        instructions.dirsToDelete.push(itemPath);
      } else if (item.isFile && !instructions.filesToWrite.includes(itemPath)) {
        instructions.filesToDelete.push(itemPath);
      }
    } else if (typeof item.queueCopyFileToDest === 'string') {
      const src = itemPath;
      const dest = item.queueCopyFileToDest;
      instructions.filesToCopy.push([src, dest]);

      const dir = normalizePath(dirname(dest));
      if (!instructions.dirsToEnsure.includes(dir)) {
        instructions.dirsToEnsure.push(dir);
      }

      const dirDeleteIndex = instructions.dirsToDelete.indexOf(dir);
      if (dirDeleteIndex > -1) {
        instructions.dirsToDelete.splice(dirDeleteIndex, 1);
      }

      const fileDeleteIndex = instructions.filesToDelete.indexOf(dest);
      if (fileDeleteIndex > -1) {
        instructions.filesToDelete.splice(fileDeleteIndex, 1);
      }
    }

    item.queueDeleteFromDisk = false;
    item.queueWriteToDisk = false;
  });

  // add all the ancestor directories for each directory too
  for (let i = 0, ilen = instructions.dirsToEnsure.length; i < ilen; i++) {
    const segments = instructions.dirsToEnsure[i].split('/');

    for (let j = 2; j < segments.length; j++) {
      const dir = segments.slice(0, j).join('/');
      if (instructions.dirsToEnsure.includes(dir) === false) {
        instructions.dirsToEnsure.push(dir);
      }
    }
  }

  // sort directories so shortest paths are ensured first
  instructions.dirsToEnsure.sort((a, b) => {
    const segmentsA = a.split('/').length;
    const segmentsB = b.split('/').length;
    if (segmentsA < segmentsB) return -1;
    if (segmentsA > segmentsB) return 1;
    if (a.length < b.length) return -1;
    if (a.length > b.length) return 1;
    return 0;
  });

  // sort directories so longest paths are removed first
  instructions.dirsToDelete.sort((a, b) => {
    const segmentsA = a.split('/').length;
    const segmentsB = b.split('/').length;
    if (segmentsA < segmentsB) return 1;
    if (segmentsA > segmentsB) return -1;
    if (a.length < b.length) return 1;
    if (a.length > b.length) return -1;
    return 0;
  });

  for (const dirToEnsure of instructions.dirsToEnsure) {
    const i = instructions.dirsToDelete.indexOf(dirToEnsure);
    if (i > -1) {
      instructions.dirsToDelete.splice(i, 1);
    }
  }

  instructions.dirsToDelete = instructions.dirsToDelete.filter((dir) => {
    if (dir === '/' || dir.endsWith(':/') === true) {
      return false;
    }
    return true;
  });

  instructions.dirsToEnsure = instructions.dirsToEnsure.filter((dir) => {
    const item = items.get(dir);
    if (item != null && item.exists === true && item.isDirectory === true) {
      return false;
    }
    if (dir === '/' || dir.endsWith(':/')) {
      return false;
    }
    return true;
  });

  return instructions;
};

/**
 * Check whether a given filepath should be ignored
 *
 * We have a little ignore list, and we just check whether the
 * filepath ends with any of the strings on the ignore list.
 *
 * @param filePath the filepath to check!
 * @returns whether we should ignore it or not
 */
export const shouldIgnore = (filePath: string): boolean => {
  filePath = filePath.trim().toLowerCase();
  return IGNORE.some((ignoreFile) => filePath.endsWith(ignoreFile));
};

/**
 * Ignore list for files which we don't want to write.
 */
const IGNORE = ['.ds_store', '.gitignore', 'desktop.ini', 'thumbs.db'];
