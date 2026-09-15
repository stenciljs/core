import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetAssets } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return assets output targets.
 *
 * The assets output copies all component `assetsDirs` to a unified location
 * that all distribution strategies can access via runtime `getAssetPath()` resolution.
 *
 * auto-generated when components have `assetsDirs` unless explicitly configured.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated assets output targets
 */
export const validateAssets = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetAssets[] => {
  return userOutputs.filter(isOutputTargetAssets).map((outputTarget) => {
    return {
      ...outputTarget,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/assets'),
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : false,
    };
  });
};
