import { isDtsFile, isString, normalizeFsPath } from '@utils';
import { basename, isAbsolute } from 'path';
import type { LoadResult, Plugin, TransformResult } from 'rollup';
import ts from 'typescript';

import type * as d from '../../declarations';
import { tsResolveModuleName } from '../sys/typescript/typescript-resolve-module';
import { getModule } from '../transpile/transpiled-module';
import type { BundleOptions } from './bundle-interface';

/**
 * Rollup plugin that aids in resolving the TypeScript files and performing the transpilation step.
 * @param compilerCtx the current compiler context
 * @param bundleOpts Rollup bundling options to apply during TypeScript compilation
 * @param config the Stencil configuration for the project
 * @returns the rollup plugin for handling TypeScript files.
 */
export const typescriptPlugin = (
  compilerCtx: d.CompilerCtx,
  bundleOpts: BundleOptions,
  config: d.ValidatedConfig,
): Plugin => {
  return {
    name: `${bundleOpts.id}TypescriptPlugin`,

    /**
     * A rollup build hook for loading TypeScript files and their associated source maps (if they exist).
     * [Source](https://rollupjs.org/guide/en/#load)
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
          const tsResult = ts.transpileModule(mod.staticSourceFileText, {
            compilerOptions: config.tsCompilerOptions,
            fileName: mod.sourceFilePath,
            transformers: {
              before: bundleOpts.customBeforeTransformers ?? [],
            },
          });
          const sourceMap: d.SourceMap = tsResult.sourceMapText ? JSON.parse(tsResult.sourceMapText) : null;
          return { code: tsResult.outputText, map: sourceMap };
        }
      }
      return null;
    },
  };
};

export const resolveIdWithTypeScript = (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx): Plugin => {
  return {
    name: `resolveIdWithTypeScript`,

    async resolveId(importee, importer) {
      if (/\0/.test(importee) || !isString(importer)) {
        return null;
      }

      const tsResolved = tsResolveModuleName(config, compilerCtx, importee, importer);
      if (tsResolved && tsResolved.resolvedModule) {
        // this is probably a .d.ts file for whatever reason in how TS resolves this
        // use this resolved file as the "importer"
        const tsResolvedPath = tsResolved.resolvedModule.resolvedFileName;
        if (isString(tsResolvedPath) && !isDtsFile(tsResolvedPath)) {
          return tsResolvedPath;
        }
      }

      return null;
    },
  };
};
