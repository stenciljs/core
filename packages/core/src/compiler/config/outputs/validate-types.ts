import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetTypes } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return types output targets.
 *
 * The types output generates TypeScript type definitions (.d.ts files)
 * that can be shared across multiple output targets.
 *
 * In v5, this is auto-generated in production builds unless explicitly configured.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated types output targets
 */
export const validateTypes = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetTypes[] => {
  return userOutputs.filter(isOutputTargetTypes).map((outputTarget) => {
    return {
      ...outputTarget,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/types'),
      empty: isBoolean(outputTarget.empty) ? outputTarget.empty : true,
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : true,
      isPrimaryPackageOutputTarget: outputTarget.isPrimaryPackageOutputTarget ?? false,
    };
  });
};
