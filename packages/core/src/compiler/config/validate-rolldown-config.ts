import type * as d from '@stencil/core';

import { isObject } from '../../utils';

/**
 * Ensure that a valid baseline rolldown configuration is set on the validated config.
 *
 * @param config a validated user-supplied configuration object
 * @returns a validated rolldown configuration
 */
export const validateRolldownConfig = (config: d.Config): d.RolldownConfig => {
  const rolldownConfig = config.rolldownConfig;

  if (!rolldownConfig || !isObject(rolldownConfig)) {
    return {};
  }

  const result: d.RolldownConfig = {};
  if ('treeshake' in rolldownConfig) result.treeshake = rolldownConfig.treeshake;
  if ('external' in rolldownConfig) result.external = rolldownConfig.external;
  return result;
};
