import { basename, isAbsolute } from 'path';
import ts from 'typescript';
import type * as d from '@stencil/core';
import type { LoadResult, Plugin, TransformResult } from 'rolldown';

import { normalizeFsPath } from '../../utils';
import { getModule } from '../transpile/transpiled-module';
import type { BundleOptions } from './bundle-interface';

/**
 * Rolldown plugin that aids in resolving the TypeScript files and performing the transpilation step.
 * @param compilerCtx the current compiler context
 * @param bundleOpts Rolldown bundling options to apply during TypeScript compilation
 * @param config the Stencil configuration for the project
 * @returns the rolldown plugin for handling TypeScript files.
 */
export const typescriptPlugin = (
  compilerCtx: d.CompilerCtx,
  bundleOpts: BundleOptions,
  config: d.ValidatedConfig,
): Plugin => {
  /**
   * Cache the result of `ts.transpileModule` for a given file, keyed by the
   * normalized file path. Rolldown re-runs the `transform` hook for every
   * `.generate()` call on the same build object (once per output format:
   * esm-browser, esm, cjs), so without this cache a 220-component project
   * would call `ts.transpileModule` 660 times; with it, only 220.
   *
   * The cache is intentionally scoped to this plugin instance (one per
   * `bundleOutput` call) so it is automatically discarded when the Rolldown
   * build object is garbage-collected — no manual invalidation required.
   */
  const transformCache = new Map<string, { outputText: string; sourceMapText: string | null }>();
  let cacheHits = 0;
  let cacheMisses = 0;

  return {
    name: `${bundleOpts.id}TypescriptPlugin`,

    buildEnd() {
      if (config.logLevel === 'debug' && cacheMisses > 0) {
        config.logger.debug(
          `${bundleOpts.id}TypescriptPlugin: ${cacheMisses} transforms computed` +
            (cacheHits > 0 ? `, ${cacheHits} from cache` : ''),
        );
      }
    },

    /**
     * A rolldown build hook for loading TypeScript files and their associated source maps (if they exist).
     * [Source](https://rolldownjs.org/guide/en/#load)
     * @param id the path of the file to load
     * @returns the module matched (with its sourcemap if it exists), null otherwise
     */
    load(id: string): LoadResult {
      if (isAbsolute(id)) {
        const fsFilePath = normalizeFsPath(id);
        const module = getModule(compilerCtx, fsFilePath);

        if (module) {
          if (!module.sourceMapFileText) {
            return { code: module.staticSourceFileText, map: null };
          }

          const sourceMap: d.SourceMap = JSON.parse(module.sourceMapFileText);
          sourceMap.sources = sourceMap.sources.map((src) => basename(src));
          return { code: module.staticSourceFileText, map: sourceMap };
        }
      }
      return null;
    },
    /**
     * Performs TypeScript compilation/transpilation, including applying any transformations against the Abstract Syntax
     * Tree (AST) specific to stencil
     * @param _code the code to modify, unused
     * @param id module's identifier
     * @returns the transpiled code, with its associated sourcemap. null otherwise
     */
    transform(_code: string, id: string): TransformResult {
      if (isAbsolute(id)) {
        const fsFilePath = normalizeFsPath(id);
        const mod = getModule(compilerCtx, fsFilePath);
        if (mod?.cmps) {
          // Return cached transpile result if available. Rolldown calls this
          // hook once per file per .generate() invocation, so subsequent
          // format variants (esm, cjs, …) get the result for free.
          const cached = transformCache.get(fsFilePath);
          if (cached) {
            cacheHits++;
            const sourceMap: d.SourceMap = cached.sourceMapText
              ? JSON.parse(cached.sourceMapText)
              : null;
            return { code: cached.outputText, map: sourceMap };
          }

          cacheMisses++;
          const tsResult = ts.transpileModule(mod.staticSourceFileText, {
            compilerOptions: config.tsCompilerOptions,
            fileName: mod.sourceFilePath,
            transformers: {
              before: bundleOpts.customBeforeTransformers ?? [],
            },
          });
          transformCache.set(fsFilePath, {
            outputText: tsResult.outputText,
            sourceMapText: tsResult.sourceMapText ?? null,
          });
          const sourceMap: d.SourceMap = tsResult.sourceMapText
            ? JSON.parse(tsResult.sourceMapText)
            : null;
          return { code: tsResult.outputText, map: sourceMap };
        }
      }
      return null;
    },
  };
};
