import { isOutputTargetDistTypes } from '@utils';
import ts from 'typescript';

import type * as d from '../../declarations';

/**
 * Derive a {@link ts.CompilerOptions} object from the options currently set
 * on the user-supplied configuration object.
 *
 * Some of these options (like the `module` setting) are hardcoded here, but
 * the following are derived from the configuration object:
 *
 * - if one of the output targets requires type declaration output (i.e. the
 *   {@link d.OutputTargetDistCustomElements.generateTypeDeclarations} option
 *   is set to `true`) then we'll set `declaration: true`
 * - the `outDir` is set to the configured cache directory
 * - the `sourceMap` and `inlineSources` options are set based on the user's
 *   {@link d.Config.sourceMap} configuration
 *
 * @param config the current user-supplied configuration
 * @returns an object containing TypeScript compiler options
 */
export const getTsOptionsToExtend = (config: d.ValidatedConfig): ts.CompilerOptions => {
  const tsOptions: ts.CompilerOptions = {
    experimentalDecorators: true,
    // if the `DIST_TYPES` output target is present then we'd like to emit
    // declaration files
    declaration: config.outputTargets.some(isOutputTargetDistTypes),
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmitOnError: false,
    outDir: config.cacheDir || config.sys.tmpDirSync(),
    sourceMap: config.sourceMap,
    inlineSources: config.sourceMap,
  };
  return tsOptions;
};
