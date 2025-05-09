import { isObject, pluck } from '@utils';

import type * as d from '../../declarations';

/**
 * Ensure that a valid baseline rollup configuration is set on the validated
 * config.
 *
 * If a config is present this will return a new config based on the user
 * supplied one.
 *
 * If no config is present, this will return a default config.
 *
 * @param config a validated user-supplied configuration object
 * @returns a validated rollup configuration
 */
export const validateRollupConfig = (config: d.Config): d.RollupConfig => {
  let cleanRollupConfig = { ...DEFAULT_ROLLUP_CONFIG };

  const rollupConfig = config.rollupConfig;

  if (!rollupConfig || !isObject(rollupConfig)) {
    return cleanRollupConfig;
  }

  if (rollupConfig.inputOptions && isObject(rollupConfig.inputOptions)) {
    cleanRollupConfig = {
      ...cleanRollupConfig,
      inputOptions: pluck(rollupConfig.inputOptions, ['context', 'moduleContext', 'treeshake', 'external', 'maxParallelFileOps']),
    };
  }

  if (rollupConfig.outputOptions && isObject(rollupConfig.outputOptions)) {
    cleanRollupConfig = {
      ...cleanRollupConfig,
      outputOptions: pluck(rollupConfig.outputOptions, ['globals']),
    };
  }

  return cleanRollupConfig;
};

const DEFAULT_ROLLUP_CONFIG: d.RollupConfig = {
  inputOptions: {},
  outputOptions: {},
};
