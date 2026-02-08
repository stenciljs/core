import { isBoolean, join } from '@utils';
import { isAbsolute } from 'path';

import type { ConfigFlags } from '../../cli/config-flags';
import type * as d from '../../declarations';

export const getAbsolutePath = (config: d.ValidatedConfig, dir: string) => {
  if (!isAbsolute(dir)) {
    dir = join(config.rootDir, dir);
  }
  return dir;
};

/**
 * This function does two things:
 *
 * 1. If you pass a `flagName`, it will hoist that `flagName` out of the
 *    `ConfigFlags` object and onto the 'root' level (if you will) of the
 *    `config` under the `configName` (`keyof d.Config`) that you pass.
 * 2. If you _don't_  pass a `flagName` it will just set the value you supply
 *    on the config.
 *
 * @param config the config that we want to update
 * @param configName the key we're setting on the config
 * @param flagName either the name of a ConfigFlag prop we want to hoist up or null
 * @param defaultValue the default value we should set!
 */
export const setBooleanConfig = <K extends keyof d.Config>(
  config: d.UnvalidatedConfig,
  configName: (K & keyof ConfigFlags) | K,
  flagName: keyof ConfigFlags | null,
  defaultValue: d.Config[K],
) => {
  if (flagName) {
    const flagValue = config.flags?.[flagName];
    if (isBoolean(flagValue)) {
      config[configName] = flagValue;
    }
  }

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
