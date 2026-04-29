import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetStencilRebundle } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return stencil-rebundle output targets.
 *
 * The stencil-rebundle output contains component source code, metadata,
 * and configuration for downstream Stencil projects to re-compile and bundle.
 *
 * In v5, this is auto-generated in production builds unless explicitly configured.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated stencil-rebundle output targets
 */
export const validateStencilRebundle = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetStencilRebundle[] => {
  return userOutputs.filter(isOutputTargetStencilRebundle).map((outputTarget) => {
    return {
      ...outputTarget,
      transformAliasedImportPaths: isBoolean(outputTarget.transformAliasedImportPaths)
        ? outputTarget.transformAliasedImportPaths
        : true,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/stencil-rebundle'),
      empty: isBoolean(outputTarget.empty) ? outputTarget.empty : true,
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : true,
    };
  });
};
