import ts from 'typescript';
import type * as d from '@stencil/core';

import { isOutputTargetTypes, join } from '../../utils';

/**
 * Derive a {@link ts.CompilerOptions} object from the options currently set
 * on the user-supplied configuration object.
 *
 * Some of these options (like the `module` setting) are hardcoded here, but
 * the following are derived from the configuration object:
 *
 * - if one of the output targets requires type declaration output then we'll set `declaration: true`
 * - the `outDir` is set to the configured cache directory
 * - the `sourceMap` and `inlineSources` options are set based on the user's
 *   {@link d.Config.sourceMap} configuration
 *
 * @param config the current user-supplied configuration
 * @returns an object containing TypeScript compiler options
 */
export const getTsOptionsToExtend = (config: d.ValidatedConfig): ts.CompilerOptions => {
  const cacheDir = config.cacheDir || config.sys.tmpDirSync();

  const tsOptions: ts.CompilerOptions = {
    experimentalDecorators: true,
    // if the `TYPES` output target is present then we'd like to emit
    // declaration files
    declaration: config.outputTargets.some(isOutputTargetTypes),
    module: config.tsCompilerOptions?.module || ts.ModuleKind.ESNext,
    moduleResolution:
      config.tsCompilerOptions?.moduleResolution === ts.ModuleResolutionKind.Bundler
        ? ts.ModuleResolutionKind.Bundler
        : ts.ModuleResolutionKind.NodeJs,
    noEmitOnError: config.tsCompilerOptions?.noEmitOnError || false,
    outDir: cacheDir,
    sourceMap: config.sourceMap,
    inlineSources: config.sourceMap,
    // Enable incremental compilation with persistent .tsbuildinfo file
    // This allows TypeScript to skip re-checking unchanged files on cold builds
    incremental: config.enableCache !== false,
    tsBuildInfoFile: config.enableCache !== false ? join(cacheDir, '.tsbuildinfo') : undefined,
  };
  return tsOptions;
};
