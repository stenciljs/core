import { isString, resolve } from '@utils';
import { dirname } from 'path';
import type ts from 'typescript';

import type * as d from '../../declarations';
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
import { createTsWatchProgram } from '../transpile/create-watch-program';
import { build } from './build';
import { BuildContext } from './build-ctx';

/**
 * This method contains context and functionality for a TS watch build. This is called via
 * the compiler when running a build in watch mode (i.e. `stencil build --watch`).
 *
 * In essence, this method tracks all files that change while the program is running to trigger
 * a rebuild of a Stencil project using a {@link ts.EmitAndSemanticDiagnosticsBuilderProgram}.
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
  let tsWatchProgram: {
    program: ts.WatchOfConfigFile<ts.EmitAndSemanticDiagnosticsBuilderProgram>;
    rebuild: () => void;
  };
  let closeResolver: Function;
  const watchWaiter = new Promise<d.WatcherCloseResults>((resolve) => (closeResolver = resolve));

  const dirsAdded = new Set<string>();
  const dirsDeleted = new Set<string>();
  const filesAdded = new Set<string>();
  const filesUpdated = new Set<string>();
  const filesDeleted = new Set<string>();

  /**
   * A callback function that is invoked to trigger a rebuild of a Stencil project. This will
   * update the build context with the associated file changes (these are used downstream to trigger
   * HMR) and then calls the `build()` function to execute the Stencil build.
   *
   * @param tsBuilder A {@link ts.BuilderProgram} to be passed to the `build()` function.
   */
  const onBuild = async (tsBuilder: ts.BuilderProgram) => {
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

    if (config.flags.debug) {
      config.logger.debug(`WATCH_BUILD::watchBuild::onBuild filesAdded: ${formatFilesForDebug(buildCtx.filesAdded)}`);
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

    // Make sure all files in the module map are still in the fs
    // Otherwise, we can run into build errors because the compiler can think
    // there are two component files with the same tag name
    Array.from(compilerCtx.moduleMap.keys()).forEach((key) => {
      if (filesUpdated.has(key) || filesDeleted.has(key)) {
        // Check if the file exists in the fs
        const fileExists = compilerCtx.fs.accessSync(key);
        if (!fileExists) {
          compilerCtx.moduleMap.delete(key);
        }
      }
    });

    // Make sure all added/updated files are watched
    // We need to check both added/updates since the TS watch program behaves kinda weird
    // and doesn't always handle file renames the same way
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

    // Rebuild the project
    const result = await build(config, compilerCtx, buildCtx, tsBuilder);

    if (result && !result.hasError) {
      isRebuild = true;
    }
  };

  /**
   * Utility method for formatting a debug message that must either list a number of files, or the word 'none' if the
   * provided list is empty
   *
   * @param files a list of files, the list may be empty
   * @returns the provided list if it is not empty. otherwise, return the word 'none'
   */
  const formatFilesForDebug = (files: ReadonlyArray<string>): string => {
    /**
     * In the created message, it's important that there's no whitespace prior to the file name.
     * Stencil's logger will split messages by whitespace according to the width of the terminal window.
     * Since file names can be fully qualified paths (and therefore quite long), putting whitespace between a '-' and
     * the path can lead to formatted messages where the '-' is on its own line
     */
    return files.length > 0 ? files.map((filename: string) => `-${filename}`).join('\n') : 'none';
  };

  /**
   * Utility method to start/construct the watch program. This will mark
   * all relevant files to be watched and then call a method to build the TS
   * program responsible for building the project.
   *
   * @returns A promise of the result of creating the watch program.
   */
  const start = async () => {
    const srcRead = watchSrcDirectory(config, compilerCtx);
    const otherRead = watchRootFiles(config, compilerCtx);
    await srcRead;
    await otherRead;
    tsWatchProgram = await createTsWatchProgram(config, onBuild);
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
   * Callback method that will execute whenever TS alerts us that a file change
   * has occurred. This will update the appropriate set with the file path based on the
   * type of change, and then will kick off a rebuild of the project.
   *
   * @param filePath The absolute path to the file in the Stencil project
   * @param eventKind The type of file change that occurred (update, add, delete)
   */
  const onFsChange: d.CompilerFileWatcherCallback = (filePath, eventKind) => {
    if (tsWatchProgram && !isWatchIgnorePath(config, filePath)) {
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

      config.logger.debug(
        `WATCH_BUILD::fs_event_change - type=${eventKind}, path=${filePath}, time=${new Date().getTime()}`,
      );

      // Trigger a rebuild of the project
      tsWatchProgram.rebuild();
    }
  };

  /**
   * Callback method that will execute when TS alerts us that a directory modification has occurred.
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
   * Utility method to teardown the TS watch program and close/clear all watched files.
   *
   * @returns An object with the `exitCode` status of the teardown.
   */
  const close = async () => {
    watchingDirs.forEach((w) => w.close());
    watchingFiles.forEach((w) => w.close());
    watchingDirs.clear();
    watchingFiles.clear();

    if (tsWatchProgram) {
      tsWatchProgram.program.close();
      tsWatchProgram = null;
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
    if (isString(filePath) && !watchingFiles.has(filePath) && !isWatchIgnorePath(config, filePath)) {
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
 * Recursively marks all files under a Stencil project's `src` directory to be watched for changes. Whenever
 * one of these files is determined as changed (according to TS), a rebuild of the project will execute.
 *
 * @param config The Stencil project's config
 * @param compilerCtx The compiler context for the Stencil project
 */
const watchSrcDirectory = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  const srcFiles = await compilerCtx.fs.readdir(config.srcDir, {
    recursive: true,
    excludeDirNames: ['.cache', '.git', '.github', '.stencil', '.vscode', 'node_modules'],
    excludeExtensions: [
      '.md',
      '.markdown',
      '.txt',
      '.spec.ts',
      '.spec.tsx',
      '.e2e.ts',
      '.e2e.tsx',
      '.gitignore',
      '.editorconfig',
    ],
  });

  // Iterate over each file in the collection (filter out directories) and add
  // a watcher for each
  srcFiles.filter(({ isFile }) => isFile).forEach(({ absPath }) => compilerCtx.addWatchFile(absPath));

  compilerCtx.addWatchDir(config.srcDir, true);
};

/**
 * Marks all root files of a Stencil project to be watched for changes. Whenever
 * one of these files is determined as changed (according to TS), a rebuild of the project will execute.
 *
 * @param config The Stencil project's config
 * @param compilerCtx The compiler context for the Stencil project
 */
const watchRootFiles = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  // non-src files that cause a rebuild
  // mainly for root level config files, and getting an event when they change
  const rootFiles = await compilerCtx.fs.readdir(config.rootDir, {
    recursive: false,
    excludeDirNames: ['.cache', '.git', '.github', '.stencil', '.vscode', 'node_modules'],
  });

  // Iterate over each file in the collection (filter out directories) and add
  // a watcher for each
  rootFiles.filter(({ isFile }) => isFile).forEach(({ absPath }) => compilerCtx.addWatchFile(absPath));
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
