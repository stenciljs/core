import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetCollection } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return collection output targets.
 *
 * The collection output contains component source code, metadata,
 * and configuration for downstream Stencil projects to re-compile and bundle.
 *
 * In v5, this is auto-generated in production builds unless explicitly configured.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated collection output targets
 */
export const validateCollection = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetCollection[] => {
  return userOutputs.filter(isOutputTargetCollection).map((outputTarget) => {
    return {
      ...outputTarget,
      transformAliasedImportPaths: isBoolean(outputTarget.transformAliasedImportPaths)
        ? outputTarget.transformAliasedImportPaths
        : true,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/collection'),
      empty: isBoolean(outputTarget.empty) ? outputTarget.empty : true,
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : true,
    };
  });
};
