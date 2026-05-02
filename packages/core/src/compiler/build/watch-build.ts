import { dirname } from 'path';
import type * as d from '@stencil/core';
import type ts from 'typescript';

import { isString, resolve } from '../../utils';
import { compilerRequest } from '../bundle/dev-module';
import {
  filesChanged,
  hasHtmlChanges,
  hasScriptChanges,
  hasStyleChanges,
  isWatchIgnorePath,
  scriptsAdded,
  scriptsDeleted,
} from '../fs-watch/fs-watch-rebuild';
import { hasServiceWorkerChanges } from '../service-worker/generate-sw';
import { IncrementalCompiler } from '../transpile/incremental-compiler';
import { build } from './build';
import { BuildContext } from './build-ctx';

/**
 * This method contains context and functionality for a watch build. This is called via
 * the compiler when running a build in watch mode (i.e. `stencil build --watch`).
 *
 * Uses an IncrementalCompiler for TypeScript compilation with explicit cache invalidation,
 * triggered by @parcel/watcher file system events.
 *
 * @param config The validated config for the Stencil project
 * @param compilerCtx The compiler context for the project
 * @returns An object containing helper methods for the dev-server's watch program
 */
export const createWatchBuild = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
): Promise<d.CompilerWatcher> => {
  let isRebuild = false;
  let isBuilding = false;
  let incrementalCompiler: IncrementalCompiler;
  let closeResolver: Function;
  const watchWaiter = new Promise<d.WatcherCloseResults>(
    (resolvePromise) => (closeResolver = resolvePromise),
  );

  const dirsAdded = new Set<string>();
  const dirsDeleted = new Set<string>();
  const filesAdded = new Set<string>();
  const filesUpdated = new Set<string>();
  const filesDeleted = new Set<string>();

  // TS files that need cache invalidation before the next rebuild
  const tsFilesToInvalidate = new Set<string>();

  // Debounce timer — multiple watchers can fire for the same change
  let rebuildTimeout: ReturnType<typeof setTimeout> | null = null;

  // Suppress FSEvents double-events (the same save can fire twice ~200-500ms apart),
  // outside the 10ms debounce window. Drop events for files built within the cooldown period.
  const recentlyBuiltFiles = new Set<string>();
  let lastBuildFinishedAt = 0;
  const DUPLICATE_EVENT_COOLDOWN_MS = 1500;

  // Files the active build was triggered by; mid-build duplicates for these are dropped.
  const currentlyBuildingFiles = new Set<string>();

  /** Trigger a rebuild, invalidating changed TS files first. */
  const triggerRebuild = async () => {
    if (isBuilding) {
      rebuildTimeout = setTimeout(triggerRebuild, 50);
      return;
    }

    isBuilding = true;
    try {
      // Re-parse tsconfig when files are added or deleted so TypeScript's root
      // file list stays in sync. Skipping this causes "file not found" errors
      // for deleted files and silently omits new components from the build.
      if (filesAdded.size > 0 || filesDeleted.size > 0) {
        incrementalCompiler.refreshRootNames();
      }

      if (tsFilesToInvalidate.size > 0) {
        incrementalCompiler.invalidateFiles(Array.from(tsFilesToInvalidate));
        tsFilesToInvalidate.clear();
      }

      // Snapshot pending files so mid-build duplicates can be suppressed in onFsChange.
      currentlyBuildingFiles.clear();
      filesAdded.forEach((f) => currentlyBuildingFiles.add(f));
      filesUpdated.forEach((f) => currentlyBuildingFiles.add(f));
      filesDeleted.forEach((f) => currentlyBuildingFiles.add(f));

      const tsBuilder = incrementalCompiler.rebuild();
      await onBuild(tsBuilder);
    } finally {
      currentlyBuildingFiles.clear();
      isBuilding = false;
    }
  };

  /**
   * A callback function that is invoked to trigger a rebuild of a Stencil project. This will
   * update the build context with the associated file changes (these are used downstream to trigger
   * HMR) and then calls the `build()` function to execute the Stencil build.
   *
   * @param tsBuilder The TypeScript builder program for transpilation.
   */
  const onBuild = async (tsBuilder: ts.EmitAndSemanticDiagnosticsBuilderProgram) => {
    const buildCtx = new BuildContext(config, compilerCtx);
    buildCtx.isRebuild = isRebuild;
    buildCtx.requiresFullBuild = !isRebuild;
    buildCtx.dirsAdded = Array.from(dirsAdded.keys()).sort();
    buildCtx.dirsDeleted = Array.from(dirsDeleted.keys()).sort();
    buildCtx.filesAdded = Array.from(filesAdded.keys()).sort();
    buildCtx.filesUpdated = Array.from(filesUpdated.keys()).sort();
    buildCtx.filesDeleted = Array.from(filesDeleted.keys()).sort();
    buildCtx.filesChanged = filesChanged(buildCtx);
    buildCtx.scriptsAdded = scriptsAdded(buildCtx);
    buildCtx.scriptsDeleted = scriptsDeleted(buildCtx);
    buildCtx.hasScriptChanges = hasScriptChanges(buildCtx);
    buildCtx.hasStyleChanges = hasStyleChanges(buildCtx);
    buildCtx.hasHtmlChanges = hasHtmlChanges(config, buildCtx);
    buildCtx.hasServiceWorkerChanges = hasServiceWorkerChanges(config, buildCtx);

    if (config.logLevel === 'debug') {
      config.logger.debug(
        `WATCH_BUILD::watchBuild::onBuild filesAdded: ${formatFilesForDebug(buildCtx.filesAdded)}`,
      );
      config.logger.debug(
        `WATCH_BUILD::watchBuild::onBuild filesDeleted: ${formatFilesForDebug(buildCtx.filesDeleted)}`,
      );
      config.logger.debug(
        `WATCH_BUILD::watchBuild::onBuild filesUpdated: ${formatFilesForDebug(buildCtx.filesUpdated)}`,
      );
      config.logger.debug(
        `WATCH_BUILD::watchBuild::onBuild filesWritten: ${formatFilesForDebug(buildCtx.filesWritten)}`,
      );
    }

    // Remove stale module map entries to prevent duplicate-tag build errors
    Array.from(compilerCtx.moduleMap.keys()).forEach((key) => {
      if (filesUpdated.has(key) || filesDeleted.has(key)) {
        // Check if the file exists in the fs
        const fileExists = compilerCtx.fs.accessSync(key);
        if (!fileExists) {
          compilerCtx.moduleMap.delete(key);
        }
      }
    });

    // Ensure newly added/updated files are watched
    new Set([...filesUpdated, ...filesAdded]).forEach((filePath) => {
      compilerCtx.addWatchFile(filePath);
    });

    dirsAdded.clear();
    dirsDeleted.clear();
    filesAdded.clear();
    filesUpdated.clear();
    filesDeleted.clear();

    emitFsChange(compilerCtx, buildCtx);

    buildCtx.start();
    const result = await build(config, compilerCtx, buildCtx, tsBuilder);

    if (result && !result.hasError) {
      isRebuild = true;
    }

    // Record consumed files so late-arriving OS duplicates are suppressed.
    recentlyBuiltFiles.clear();
    buildCtx.filesChanged.forEach((f) => recentlyBuiltFiles.add(f));
    lastBuildFinishedAt = Date.now();
  };

  /**
   * Returns files as a prefixed list, or 'none' if empty.
   * No space before the filename — the logger wraps on whitespace.
   * @param files the list of files to format for debug output
   * @returns the formatted string for debug output
   */
  const formatFilesForDebug = (files: ReadonlyArray<string>): string => {
    return files.length > 0 ? files.map((filename: string) => `-${filename}`).join('\n') : 'none';
  };

  /**
   * Start watchers for all relevant directories and run the initial build.
   * @returns a promise that resolves when the watch program is closed.
   */
  const start = async () => {
    await Promise.all([
      watchFiles(compilerCtx, config.srcDir),
      watchFiles(compilerCtx, config.rootDir, { recursive: false }),
      ...(config.watchExternalDirs || []).map((dir) => watchFiles(compilerCtx, dir)),
    ]);

    incrementalCompiler = new IncrementalCompiler(config);
    const tsBuilder = incrementalCompiler.rebuild();
    await onBuild(tsBuilder);

    return watchWaiter;
  };

  /**
   * A map of absolute directory paths and their associated {@link d.CompilerFileWatcher} (which contains
   * the ability to teardown the watcher for the specific directory)
   */
  const watchingDirs = new Map<string, d.CompilerFileWatcher>();
  /**
   * A map of absolute file paths and their associated {@link d.CompilerFileWatcher} (which contains
   * the ability to teardown the watcher for the specific file)
   */
  const watchingFiles = new Map<string, d.CompilerFileWatcher>();

  /**
   * Callback method that will execute whenever a file change has occurred.
   * This will update the appropriate set with the file path based on the
   * type of change, and then will kick off a rebuild of the project.
   *
   * @param filePath The absolute path to the file in the Stencil project
   * @param eventKind The type of file change that occurred (update, add, delete)
   */
  const onFsChange: d.CompilerFileWatcherCallback = (filePath, eventKind) => {
    if (incrementalCompiler && !isWatchIgnorePath(config, filePath)) {
      // Drop duplicate OS events: same file within cooldown window, or mid-build duplicate.
      const isDuplicateOfRecentBuild =
        recentlyBuiltFiles.has(filePath) &&
        Date.now() - lastBuildFinishedAt < DUPLICATE_EVENT_COOLDOWN_MS;
      const isDuplicateMidBuild = isBuilding && currentlyBuildingFiles.has(filePath);
      if (isDuplicateOfRecentBuild || isDuplicateMidBuild) {
        config.logger.debug(
          `WATCH_BUILD::fs_event_change suppressed duplicate - type=${eventKind}, path=${filePath}`,
        );
        return;
      }

      updateCompilerCtxCache(config, compilerCtx, filePath, eventKind);

      switch (eventKind) {
        case 'dirAdd':
          dirsAdded.add(filePath);
          break;
        case 'dirDelete':
          dirsDeleted.add(filePath);
          break;
        case 'fileAdd':
          filesAdded.add(filePath);
          break;
        case 'fileUpdate':
          filesUpdated.add(filePath);
          break;
        case 'fileDelete':
          filesDeleted.add(filePath);
          break;
      }

      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        tsFilesToInvalidate.add(filePath);
      }

      config.logger.debug(
        `WATCH_BUILD::fs_event_change - type=${eventKind}, path=${filePath}, time=${new Date().getTime()}`,
      );

      if (rebuildTimeout) {
        clearTimeout(rebuildTimeout);
      }
      rebuildTimeout = setTimeout(() => {
        rebuildTimeout = null;
        triggerRebuild();
      }, 10);
    }
  };

  /**
   * Callback method that will execute when a directory modification has occurred.
   * This will just call the `onFsChange()` callback method with the same arguments.
   *
   * @param filePath The absolute path to the file in the Stencil project
   * @param eventKind The type of file change that occurred (update, add, delete)
   */
  const onDirChange: d.CompilerFileWatcherCallback = (filePath, eventKind) => {
    if (eventKind != null) {
      onFsChange(filePath, eventKind);
    }
  };

  /**
   * Utility method to teardown the watch program and close/clear all watched files.
   *
   * @returns An object with the `exitCode` status of the teardown.
   */
  const close = async () => {
    watchingDirs.forEach((w) => w.close());
    watchingFiles.forEach((w) => w.close());
    watchingDirs.clear();
    watchingFiles.clear();

    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
      rebuildTimeout = null;
    }

    const watcherCloseResults: d.WatcherCloseResults = {
      exitCode: 0,
    };
    closeResolver(watcherCloseResults);
    return watcherCloseResults;
  };

  const request = async (data: d.CompilerRequest) => compilerRequest(config, compilerCtx, data);

  // Add a definition to the `compilerCtx` for `addWatchFile`
  // This method will add the specified file path to the watched files collection and instruct
  // the `CompilerSystem` what to do when a file change occurs (the `onFsChange()` callback)
  compilerCtx.addWatchFile = (filePath) => {
    if (
      isString(filePath) &&
      !watchingFiles.has(filePath) &&
      !isWatchIgnorePath(config, filePath)
    ) {
      watchingFiles.set(filePath, config.sys.watchFile(filePath, onFsChange));
    }
  };

  // Add a definition to the `compilerCtx` for `addWatchDir`
  // This method will add the specified file path to the watched directories collection and instruct
  // the `CompilerSystem` what to do when a directory change occurs (the `onDirChange()` callback)
  compilerCtx.addWatchDir = (dirPath, recursive) => {
    if (isString(dirPath) && !watchingDirs.has(dirPath) && !isWatchIgnorePath(config, dirPath)) {
      watchingDirs.set(dirPath, config.sys.watchDirectory(dirPath, onDirChange, recursive));
    }
  };

  // When the compiler system destroys, we need to also destroy this watch program
  config.sys.addDestroy(close);

  return {
    start,
    close,
    on: compilerCtx.events.on,
    request,
  };
};

/**
 * A list of directories that are excluded from being watched for changes.
 */
const EXCLUDE_DIRS = ['.cache', '.git', '.github', '.stencil', '.vscode', 'node_modules'];

/**
 * A list of file extensions that are excluded from being watched for changes.
 */
const EXCLUDE_EXTENSIONS = [
  '.md',
  '.markdown',
  '.txt',
  '.spec.ts',
  '.spec.tsx',
  '.e2e.ts',
  '.e2e.tsx',
  '.gitignore',
  '.editorconfig',
];

/**
 * Marks all root files of a Stencil project to be watched for changes. Whenever
 * one of these files is determined as changed (according to TS), a rebuild of the project will execute.
 *
 * @param compilerCtx The compiler context for the Stencil project
 * @param dir The directory to watch for changes
 * @param options The options to watch files in the directory
 * @param options.recursive Whether to watch files recursively
 * @param options.excludeDirNames A list of directories to exclude from being watched
 * @param options.excludeExtensions A list of file extensions to exclude from being watched for changes
 */
const watchFiles = async (
  compilerCtx: d.CompilerCtx,
  dir: string,
  options?: {
    recursive?: boolean;
    excludeDirNames?: string[];
    excludeExtensions?: string[];
  },
) => {
  const recursive = options?.recursive ?? true;
  const excludeDirNames = options?.excludeDirNames ?? EXCLUDE_DIRS;
  const excludeExtensions = options?.excludeExtensions ?? EXCLUDE_EXTENSIONS;

  /**
   * non-src files that cause a rebuild
   * mainly for root level config files, and getting an event when they change
   */
  const rootFiles = await compilerCtx.fs.readdir(dir, {
    recursive,
    excludeDirNames,
    excludeExtensions,
  });

  /**
   * If the directory is watched recursively, we need to watch the directory itself.
   */
  if (recursive) {
    compilerCtx.addWatchDir(dir, true);
  }

  /**
   * Iterate over each file in the collection (filter out directories) and add
   * a watcher for each
   */
  rootFiles
    .filter(({ isFile }) => isFile)
    .forEach(({ absPath }) => compilerCtx.addWatchFile(absPath));
};

const emitFsChange = (compilerCtx: d.CompilerCtx, buildCtx: BuildContext) => {
  if (
    buildCtx.dirsAdded.length > 0 ||
    buildCtx.dirsDeleted.length > 0 ||
    buildCtx.filesUpdated.length > 0 ||
    buildCtx.filesAdded.length > 0 ||
    buildCtx.filesDeleted.length > 0
  ) {
    compilerCtx.events.emit('fsChange', {
      dirsAdded: buildCtx.dirsAdded.slice(),
      dirsDeleted: buildCtx.dirsDeleted.slice(),
      filesUpdated: buildCtx.filesUpdated.slice(),
      filesAdded: buildCtx.filesAdded.slice(),
      filesDeleted: buildCtx.filesDeleted.slice(),
    });
  }
};

const updateCompilerCtxCache = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  path: string,
  kind: d.CompilerFileWatcherEvent,
) => {
  compilerCtx.fs.clearFileCache(path);
  compilerCtx.changedFiles.add(path);

  if (kind === 'fileDelete') {
    compilerCtx.moduleMap.delete(path);
  } else if (kind === 'dirDelete') {
    const fsRootDir = resolve('/');
    compilerCtx.moduleMap.forEach((_, moduleFilePath) => {
      let moduleAncestorDir = dirname(moduleFilePath);

      for (let i = 0; i < 50; i++) {
        if (moduleAncestorDir === config.rootDir || moduleAncestorDir === fsRootDir) {
          break;
        }

        if (moduleAncestorDir === path) {
          compilerCtx.fs.clearFileCache(moduleFilePath);
          compilerCtx.moduleMap.delete(moduleFilePath);
          compilerCtx.changedFiles.add(moduleFilePath);
          break;
        }

        moduleAncestorDir = dirname(moduleAncestorDir);
      }
    });
  }
};
