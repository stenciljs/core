import { createNodeLogger } from '../../sys/node';

import { createConfigFlags } from '@stencil/cli';
import type * as d from '@stencil/core';
import { validateConfig } from '../config/validate-config';

/**
 * Given a user-supplied config, get a validated config which can be used to
 * start building a Stencil project.
 *
 * @param userConfig a configuration object
 * @returns a validated config object with stricter typing
 */
export const getConfig = (userConfig: d.Config): d.ValidatedConfig => {
  userConfig.logger = userConfig.logger ?? createNodeLogger();
  const config: d.ValidatedConfig = validateConfig(userConfig, {}).config;

  return config;
};
