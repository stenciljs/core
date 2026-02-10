import { isBoolean, join } from '../../utils';
import { isAbsolute } from 'path';

import type * as d from '@stencil/core';

export const getAbsolutePath = (config: d.ValidatedConfig, dir: string) => {
  if (!isAbsolute(dir)) {
    dir = join(config.rootDir, dir);
  }
  return dir;
};

/**
 * Set a boolean configuration value with a default.
 *
 * If the config already has a value for `configName`, use it.
 * Otherwise, set it to `defaultValue`.
 *
 * Note: CLI flags are now merged into config before validation,
 * so this function no longer needs to know about flags.
 *
 * @param config the config that we want to update
 * @param configName the key we're setting on the config
 * @param defaultValue the default value we should set!
 */
export const setBooleanConfig = <K extends keyof d.Config>(
  config: d.UnvalidatedConfig,
  configName: K,
  defaultValue: d.Config[K],
) => {
  const userConfigName = getUserConfigName(config, configName);

  if (typeof config[userConfigName] === 'function') {
    config[userConfigName] = !!config[userConfigName]();
  }

  if (isBoolean(config[userConfigName])) {
    config[configName] = config[userConfigName];
  } else {
    config[configName] = defaultValue;
  }
};

/**
 * Find any possibly mis-capitalized configuration names on the config, logging
 * and warning if one is found.
 *
 * @param config the user-supplied config that we're dealing with
 * @param correctConfigName the configuration name that we're checking for right now
 * @returns a string container a mis-capitalized config name found on the
 * config object, if any.
 */
const getUserConfigName = (config: d.UnvalidatedConfig, correctConfigName: keyof d.Config): string => {
  const userConfigNames = Object.keys(config);

  for (const userConfigName of userConfigNames) {
    if (userConfigName.toLowerCase() === correctConfigName.toLowerCase()) {
      if (userConfigName !== correctConfigName) {
        config.logger?.warn(`config "${userConfigName}" should be "${correctConfigName}"`);
        return userConfigName;
      }
      break;
    }
  }

  return correctConfigName;
};
