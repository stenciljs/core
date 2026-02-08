import { createNodeLogger } from '@sys-api-node';

import { createConfigFlags } from '../../cli/config-flags';
import type * as d from '../../declarations';
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
  const flags = createConfigFlags(userConfig.flags ?? {});
  userConfig.flags = flags;
  const config: d.ValidatedConfig = validateConfig(userConfig, {}).config;

  return config;
};
