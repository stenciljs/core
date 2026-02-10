import { isFunction } from '@stencil/core/compiler/utils';

import type { ValidatedConfig } from '@stencil/core';
import type { ConfigFlags } from './config-flags';

/**
 * Retrieve a reference to the active `CompilerSystem`'s `checkVersion` function
 * @param config the Stencil configuration associated with the currently compiled project
 * @param currentVersion the Stencil compiler's version string
 * @param flags the CLI flags (owned by CLI, not part of core config)
 * @returns a reference to `checkVersion`, or `null` if one does not exist on the current `CompilerSystem`
 */
export const startCheckVersion = async (
  config: ValidatedConfig,
  currentVersion: string,
  flags: ConfigFlags,
): Promise<(() => void) | null> => {
  if (config.devMode && !flags.ci && !currentVersion.includes('-dev.') && isFunction(config.sys.checkVersion)) {
    return config.sys.checkVersion(config.logger, currentVersion);
  }
  return null;
};

/**
 * Print the results of running the provided `versionChecker`.
 *
 * Does not print if no `versionChecker` is provided.
 *
 * @param versionChecker the function to invoke.
 */
export const printCheckVersionResults = async (versionChecker: Promise<(() => void) | null>): Promise<void> => {
  if (versionChecker) {
    const checkVersionResults = await versionChecker;
    if (isFunction(checkVersionResults)) {
      checkVersionResults();
    }
  }
};
