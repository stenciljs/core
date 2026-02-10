import type { Config } from '@stencil/core';
import type { ConfigFlags } from './config-flags';

/**
 * Merge CLI flags into a Stencil configuration object.
 *
 * This function applies command-line flags to the config, with CLI flags
 * taking precedence over config file values. This is the canonical place
 * where flag values are translated into config properties.?
 *
 * @param config The config object (from stencil.config.ts or empty)
 * @param flags The parsed CLI flags
 * @returns The config with flags merged in
 */
export const mergeFlags = (config: Config, flags: ConfigFlags): Config => {
  const merged = { ...config };

  // --dev / --prod → devMode
  if (flags.prod === true) {
    merged.devMode = false;
  } else if (flags.dev === true) {
    merged.devMode = true;
  }

  // --verbose / --debug → logLevel
  if (flags.debug === true || flags.verbose === true) {
    merged.logLevel = 'debug';
  } else if (flags.logLevel) {
    merged.logLevel = flags.logLevel;
  }

  // --watch → watch
  if (typeof flags.watch === 'boolean') {
    merged.watch = flags.watch;
  }

  // --docs → buildDocs
  if (typeof flags.docs === 'boolean') {
    merged.buildDocs = flags.docs;
  }

  // --esm → buildDist
  if (typeof flags.esm === 'boolean') {
    merged.buildDist = flags.esm;
  }

  // --profile → profile
  if (typeof flags.profile === 'boolean') {
    merged.profile = flags.profile;
  }

  // --log → writeLog
  if (typeof flags.log === 'boolean') {
    merged.writeLog = flags.log;
  }

  // --cache → enableCache
  if (typeof flags.cache === 'boolean') {
    merged.enableCache = flags.cache;
  }

  // --ci → testing.ci (for test runs)
  if (typeof flags.ci === 'boolean' && merged.testing) {
    merged.testing = { ...merged.testing, ci: flags.ci };
  }

  return merged;
};
