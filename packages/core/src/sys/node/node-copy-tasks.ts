import path from 'path';
import picomatch from 'picomatch';
import { glob } from 'tinyglobby';
import type * as d from '@stencil/core';

import { buildError, catchError, flatOne, isGlob, normalizePath } from '../../utils';
import { copyFile, mkdir, readdir, stat } from './node-fs-promisify';

/**
 * Copy a file with retry logic for transient Windows errors (EBUSY, EPERM, EACCES).
 * These errors commonly occur on Windows CI when antivirus or indexing services
 * temporarily lock files.
 *
 * @param src - The source file path to copy from
 * @param dest - The destination file path to copy to
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns A promise that resolves when the file is successfully copied
 * @throws The original error if all retry attempts fail or the error is not retryable
 */
async function copyFileWithRetry(src: string, dest: string, maxRetries = 3): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await copyFile(src, dest);
      return;
    } catch (err: any) {
      const isRetryable = ['EBUSY', 'EPERM', 'EACCES'].includes(err.code);
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      // Exponential backoff: 100ms, 200ms, 400ms
      await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }
}

export async function nodeCopyTasks(copyTasks: Required<d.CopyTask>[], srcDir: string) {
  const results: d.CopyResults = {
    diagnostics: [],
    dirPaths: [],
    filePaths: [],
  };

  try {
    copyTasks = flatOne(
      await Promise.all(
        copyTasks.map(async (task) => {
          const fileTasks = await processGlobs(task, srcDir);
          if (!fileTasks.some(escapesDest)) {
            return fileTasks;
          }
          // reported even with `warn: false`, which only silences a missing `src`
          const err = buildError(results.diagnostics);
          err.messageText = `Copy task "${task.src}" would write outside its destination "${task.dest}". Set "dest" (without "keepDirStructure") when copying from outside the src directory.`;
          return [];
        }),
      ),
    );

    const allCopyTasks: d.CopyTask[] = [];

    // figure out all the file copy tasks we'll have
    // by digging down through any directory copy tasks
    while (copyTasks.length > 0) {
      const tasks = copyTasks.splice(0, 100);

      await Promise.all(tasks.map((copyTask) => processCopyTask(results, allCopyTasks, copyTask)));
    }

    // figure out which directories we'll need to make first
    const mkDirs = ensureDirs(allCopyTasks);

    try {
      await Promise.all(mkDirs.map((dir) => mkdir(dir, { recursive: true })));
    } catch {}

    while (allCopyTasks.length > 0) {
      const tasks = allCopyTasks.splice(0, 100);

      await Promise.all(tasks.map((copyTask) => copyFileWithRetry(copyTask.src, copyTask.dest)));
    }
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }

  return results;
}

/** A per-file copy task, plus the destination directory it must stay inside. */
type ResolvedCopyTask = Required<d.CopyTask> & { destRoot: string };

async function processGlobs(
  copyTask: Required<d.CopyTask>,
  srcDir: string,
): Promise<ResolvedCopyTask[]> {
  return isGlob(copyTask.src)
    ? await processGlobTask(copyTask, srcDir)
    : [
        {
          src: getSrcAbsPath(srcDir, copyTask.src),
          dest: copyTask.keepDirStructure ? path.join(copyTask.dest, copyTask.src) : copyTask.dest,
          warn: copyTask.warn,
          ignore: copyTask.ignore,
          keepDirStructure: copyTask.keepDirStructure,
          destRoot: copyTask.dest,
        },
      ];
}

/**
 * Keeping the directory structure of a `src` outside `srcDir` (`../x`) would carry the `../`
 * into the destination path.
 *
 * @param task a per-file copy task
 * @returns `true` if the task would write outside its destination directory
 */
function escapesDest({ dest, destRoot }: ResolvedCopyTask) {
  const rel = path.relative(destRoot, dest);
  return rel.startsWith('..') || path.isAbsolute(rel);
}

function getSrcAbsPath(srcDir: string, src: string) {
  if (path.isAbsolute(src)) {
    return src;
  }
  return path.join(srcDir, src);
}

async function processGlobTask(
  copyTask: Required<d.CopyTask>,
  srcDir: string,
): Promise<ResolvedCopyTask[]> {
  const files = await asyncGlob(copyTask.src, {
    cwd: srcDir,
    nodir: true,
    ignore: copyTask.ignore,
  });
  return files.map((globRelPath) => createGlobCopyTask(copyTask, srcDir, globRelPath));
}

function createGlobCopyTask(
  copyTask: Required<d.CopyTask>,
  srcDir: string,
  globRelPath: string,
): ResolvedCopyTask {
  const dest = path.join(
    copyTask.dest,
    copyTask.keepDirStructure ? globRelPath : path.basename(globRelPath),
  );
  return {
    src: path.join(srcDir, globRelPath),
    dest,
    ignore: copyTask.ignore,
    warn: copyTask.warn,
    keepDirStructure: copyTask.keepDirStructure,
    destRoot: copyTask.dest,
  };
}

/** A directory copy in progress: ignore patterns match paths relative to `root`. */
interface DirectoryWalk {
  root: string;
  isIgnored: (relPath: string) => boolean;
}

const createDirectoryWalk = ({ src, ignore = [] }: d.CopyTask): DirectoryWalk => ({
  root: src,
  isIgnored: picomatch(ignore, { dot: true, nocase: true }),
});

async function processCopyTask(
  results: d.CopyResults,
  allCopyTasks: d.CopyTask[],
  copyTask: d.CopyTask,
  walk?: DirectoryWalk,
) {
  try {
    copyTask.src = normalizePath(copyTask.src);
    copyTask.dest = normalizePath(copyTask.dest);

    // get the stats for this src to see if it's a directory or not
    const stats = await stat(copyTask.src);
    if (stats.isDirectory()) {
      // still a directory, keep digging down
      if (!results.dirPaths.includes(copyTask.dest)) {
        results.dirPaths.push(copyTask.dest);
      }

      await processCopyTaskDirectory(
        results,
        allCopyTasks,
        copyTask,
        walk ?? createDirectoryWalk(copyTask),
      );
    } else if (!walk || !walk.isIgnored(path.posix.relative(walk.root, copyTask.src))) {
      // an explicitly named file (not found by walking a directory) is never ignored
      // this is a file we should copy
      if (!results.filePaths.includes(copyTask.dest)) {
        results.filePaths.push(copyTask.dest);
      }

      allCopyTasks.push(copyTask);
    }
  } catch (e) {
    if (copyTask.warn !== false) {
      const err = buildError(results.diagnostics);
      if (e instanceof Error) {
        err.messageText = e.message;
      }
    }
  }
}

async function processCopyTaskDirectory(
  results: d.CopyResults,
  allCopyTasks: d.CopyTask[],
  copyTask: d.CopyTask,
  walk: DirectoryWalk,
) {
  try {
    const dirItems = await readdir(copyTask.src);

    await Promise.all(
      dirItems.map(async (dirItem) => {
        const subCopyTask: d.CopyTask = {
          src: path.join(copyTask.src, dirItem),
          dest: path.join(copyTask.dest, dirItem),
          warn: copyTask.warn,
        };

        await processCopyTask(results, allCopyTasks, subCopyTask, walk);
      }),
    );
  } catch (e: any) {
    catchError(results.diagnostics, e);
  }
}

function ensureDirs(copyTasks: d.CopyTask[]) {
  const mkDirs: string[] = [];

  copyTasks.forEach((copyTask) => {
    addMkDir(mkDirs, path.dirname(copyTask.dest));
  });

  mkDirs.sort((a, b) => {
    const partsA = a.split('/').length;
    const partsB = b.split('/').length;

    if (partsA < partsB) return -1;
    if (partsA > partsB) return 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  return mkDirs;
}

function addMkDir(mkDirs: string[], destDir: string) {
  destDir = normalizePath(destDir);

  if (destDir === ROOT_DIR || destDir + '/' === ROOT_DIR || destDir === '') {
    return;
  }

  if (!mkDirs.includes(destDir)) {
    mkDirs.push(destDir);
  }
}

const ROOT_DIR = normalizePath(path.resolve('/'));

export function asyncGlob(
  pattern: string,
  opts: { cwd?: string; nodir?: boolean; ignore?: string[]; [key: string]: any } = {},
): Promise<string[]> {
  const { nodir, ...rest } = opts;
  return glob(pattern, { ...rest, onlyFiles: nodir ?? true });
}
