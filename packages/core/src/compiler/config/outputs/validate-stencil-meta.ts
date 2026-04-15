import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetStencilMeta } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return stencil-meta output targets.
 *
 * The stencil-meta output contains component metadata, transpiled source,
 * and configuration for downstream Stencil projects to consume.
 *
 * In v5, this is auto-generated in production builds unless explicitly configured.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated stencil-meta output targets
 */
export const validateStencilMeta = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetStencilMeta[] => {
  return userOutputs.filter(isOutputTargetStencilMeta).map((outputTarget) => {
    return {
      ...outputTarget,
      transformAliasedImportPaths: isBoolean(outputTarget.transformAliasedImportPaths)
        ? outputTarget.transformAliasedImportPaths
        : true,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/stencil-meta'),
      empty: isBoolean(outputTarget.empty) ? outputTarget.empty : true,
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : true,
    };
  });
};
