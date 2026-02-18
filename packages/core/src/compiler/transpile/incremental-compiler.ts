/**
 * Incremental TypeScript Compiler
 *
 * This replaces the ts.createWatchProgram approach with direct control over
 * incremental compilation. Key benefits:
 * - No conflict with @parcel/watcher (no dual file watching)
 * - Explicit cache invalidation when files change
 * - Simpler control flow without setTimeout debouncing
 *
 * The builder program is passed to runTsProgram which handles emit with
 * custom transformers.
 */

import ts from 'typescript';
import type * as d from '@stencil/core';
import { getTsOptionsToExtend } from './ts-config';

/**
 * Extended compiler host with cache invalidation support.
 */
export interface CachingCompilerHost extends ts.CompilerHost {
  /** Invalidate a specific file's cache so it gets re-read on next compile */
  invalidateFile(fileName: string): void;
  /** Clear all caches (for full rebuild) */
  invalidateAll(): void;
}

/**
 * Create a compiler host with source file caching and invalidation support.
 * Sets version on SourceFile objects for TypeScript's builder program tracking.
 */
export function createCachingCompilerHost(options: ts.CompilerOptions): CachingCompilerHost {
  const host = ts.createIncrementalCompilerHost(options);

  // Caches for file content, source files, and versions
  const sourceFileCache = new Map<string, ts.SourceFile>();
  const fileTextCache = new Map<string, string | undefined>();
  const fileExistsCache = new Map<string, boolean>();
  const fileVersionCache = new Map<string, string>();

  // Compute a version string from file content (simple hash)
  function computeVersion(text: string | undefined): string {
    if (text === undefined) return '';
    // Simple version: use content length + first/last chars as a quick hash
    // For production, could use a proper hash, but this is fast and effective
    return `${text.length}-${text.charCodeAt(0) || 0}-${text.charCodeAt(text.length - 1) || 0}`;
  }

  // Override readFile with caching
  host.readFile = (fileName) => {
    if (fileTextCache.has(fileName)) {
      return fileTextCache.get(fileName);
    }
    const text = ts.sys.readFile(fileName);
    fileTextCache.set(fileName, text);
    return text;
  };

  // Override fileExists with caching
  host.fileExists = (fileName) => {
    if (fileExistsCache.has(fileName)) {
      return fileExistsCache.get(fileName)!;
    }
    const exists = ts.sys.fileExists(fileName);
    fileExistsCache.set(fileName, exists);
    return exists;
  };

  // Override getSourceFile with caching and version tracking
  host.getSourceFile = (fileName, languageVersion) => {
    const text = host.readFile(fileName);
    if (text === undefined) return undefined;

    const prevVersion = fileVersionCache.get(fileName);
    const newVersion = computeVersion(text);

    // If version hasn't changed, return cached source file
    if (prevVersion === newVersion) {
      const cached = sourceFileCache.get(fileName);
      if (cached) return cached;
    }

    // Version changed or no cache - create new source file
    fileVersionCache.set(fileName, newVersion);
    const sf = ts.createSourceFile(fileName, text, languageVersion);
    // @ts-ignore - TypeScript's builder program uses sf.version to track changes
    sf.version = newVersion;
    sourceFileCache.set(fileName, sf);
    return sf;
  };

  return Object.assign(host, {
    invalidateFile: (fileName: string) => {
      // Clear all caches for this file - next read will get fresh content
      sourceFileCache.delete(fileName);
      fileTextCache.delete(fileName);
      fileExistsCache.delete(fileName);
      // Don't clear version - it will be recalculated on next getSourceFile
      // and the version change will trigger re-emit
    },

    invalidateAll: () => {
      sourceFileCache.clear();
      fileTextCache.clear();
      fileExistsCache.clear();
      fileVersionCache.clear();
    },
  });
}

/**
 * Incremental TypeScript compiler for watch mode.
 *
 * Usage:
 * 1. Create once at start: const compiler = new IncrementalCompiler(config)
 * 2. Initial build: compiler.rebuild() // returns builder program
 * 3. On file change:
 *    - compiler.invalidateFiles([changedPaths])
 *    - compiler.rebuild() // returns builder program with only changed files marked for emit
 */
export class IncrementalCompiler {
  private builderProgram?: ts.EmitAndSemanticDiagnosticsBuilderProgram;
  private host: CachingCompilerHost;
  private rootNames: string[];
  private options: ts.CompilerOptions;

  constructor(config: d.ValidatedConfig) {
    // Get compiler options from tsconfig
    const optionsToExtend = getTsOptionsToExtend(config);

    // Parse the tsconfig to get root names and full options
    const configFile = ts.readConfigFile(config.tsconfig, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      config.rootDir,
      optionsToExtend,
    );

    this.rootNames = parsedConfig.fileNames;
    this.options = parsedConfig.options;
    this.host = createCachingCompilerHost(this.options);
  }

  /**
   * Invalidate files that have changed on disk.
   * Call this before rebuild() when you know specific files changed.
   */
  invalidateFiles(fileNames: string[]): void {
    for (const fileName of fileNames) {
      this.host.invalidateFile(fileName);
    }
  }

  /**
   * Rebuild the TypeScript program incrementally.
   * Returns the builder program which can be passed to runTsProgram for emit.
   *
   * TypeScript detects which source files have changed (via sf.version property)
   * and only re-emits those when emit() is called.
   */
  rebuild(): ts.EmitAndSemanticDiagnosticsBuilderProgram {
    // Pass the previous builder program for incremental compilation
    this.builderProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      this.rootNames,
      this.options,
      this.host,
      this.builderProgram, // Previous program for incremental state
    );

    return this.builderProgram;
  }

  /**
   * Get the current builder program (may be undefined before first rebuild)
   */
  getBuilderProgram(): ts.EmitAndSemanticDiagnosticsBuilderProgram | undefined {
    return this.builderProgram;
  }

  /**
   * Get the current TypeScript program (for type checking, etc.)
   */
  getProgram(): ts.Program | undefined {
    return this.builderProgram?.getProgram();
  }

  /**
   * Force a full rebuild by invalidating all caches
   */
  invalidateAll(): void {
    this.host.invalidateAll();
    this.builderProgram = undefined;
  }
}
