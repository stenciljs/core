import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetGlobalStyle } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return global-style output targets.
 *
 * The global-style output generates a unified CSS file from the `globalStyle` config option,
 * placed in a shared location that all distribution strategies can access.
 *
 * auto-generated when `globalStyle` is configured unless explicitly configured.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated global-style output targets
 */
export const validateGlobalStyle = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetGlobalStyle[] => {
  return userOutputs.filter(isOutputTargetGlobalStyle).map((outputTarget) => {
    return {
      ...outputTarget,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/assets'),
      copyToLoaderBrowser: isBoolean(outputTarget.copyToLoaderBrowser)
        ? outputTarget.copyToLoaderBrowser
        : true,
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : false,
    };
  });
};
