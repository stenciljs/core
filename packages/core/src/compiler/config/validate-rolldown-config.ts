import type * as d from '@stencil/core';

import { isObject, pluck } from '../../utils';

/**
 * Ensure that a valid baseline rolldown configuration is set on the validated
 * config.
 *
 * If a config is present this will return a new config based on the user
 * supplied one.
 *
 * If no config is present, this will return a default config.
 *
 * @param config a validated user-supplied configuration object
 * @returns a validated rolldown configuration
 */
export const validateRolldownConfig = (config: d.Config): d.RolldownConfig => {
  let cleanRolldownConfig = { ...DEFAULT_ROLLDOWN_CONFIG };

  const rolldownConfig = config.rolldownConfig;

  if (!rolldownConfig || !isObject(rolldownConfig)) {
    return cleanRolldownConfig;
  }

  if (rolldownConfig.inputOptions && isObject(rolldownConfig.inputOptions)) {
    cleanRolldownConfig = {
      ...cleanRolldownConfig,
      inputOptions: pluck(rolldownConfig.inputOptions, [
        'context',
        'moduleContext',
        'treeshake',
        'external',
        'maxParallelFileOps',
      ]),
    };
  }

  if (rolldownConfig.outputOptions && isObject(rolldownConfig.outputOptions)) {
    cleanRolldownConfig = {
      ...cleanRolldownConfig,
      outputOptions: pluck(rolldownConfig.outputOptions, ['globals']),
    };
  }

  return cleanRolldownConfig;
};

const DEFAULT_ROLLDOWN_CONFIG: d.RolldownConfig = {
  inputOptions: {},
  outputOptions: {},
};
