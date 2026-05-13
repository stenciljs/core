import type { UnvalidatedConfig } from '@stencil/core/compiler';

import type { ConfigFlags } from './config-flags';

/**
 * Merge CLI flags into a Stencil configuration object.
 *
 * This function applies command-line flags to the config, with CLI flags
 * taking precedence over config file values. This is the canonical place
 * where flag values are translated into config properties.
 *
 * @param config The config object (from stencil.config.ts or empty)
 * @param flags The parsed CLI flags
 * @returns The config with flags merged in
 */
export const mergeFlags = (config: UnvalidatedConfig, flags: ConfigFlags): UnvalidatedConfig => {
  const merged: UnvalidatedConfig = { ...config };

  // --dev → devMode (production is the default; --dev is the explicit opt-in)
  if (flags.dev === true) {
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

  // --docs → _docsFlag (internal flag to force docs in dev mode)
  // This is processed during output target validation to set skipInDev: false on docs targets
  if (flags.docs === true) {
    merged._docsFlag = true;
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

  // --ci → ci
  if (typeof flags.ci === 'boolean') {
    merged.ci = flags.ci;
  }

  // --ssr → ssr
  if (typeof flags.ssr === 'boolean') {
    merged.ssr = flags.ssr;
  }

  // --prerender → prerender
  if (typeof flags.prerender === 'boolean') {
    merged.prerender = flags.prerender;
  }

  // --docsJson → docsJsonPath
  if (typeof flags.docsJson === 'string') {
    merged.docsJsonPath = flags.docsJson;
  }

  // --stats → statsJsonPath
  if (flags.stats) {
    merged.statsJsonPath = flags.stats;
  }

  // --serviceWorker → generateServiceWorker
  if (typeof flags.serviceWorker === 'boolean') {
    merged.generateServiceWorker = flags.serviceWorker;
  }

  // --maxWorkers → maxConcurrentWorkers
  if (typeof flags.maxWorkers === 'number') {
    merged.maxConcurrentWorkers = flags.maxWorkers;
  }

  // Dev server overrides
  if (typeof flags.address === 'string') {
    merged.devServerAddress = flags.address;
  }
  if (typeof flags.port === 'number') {
    merged.devServerPort = flags.port;
  }
  if (typeof flags.open === 'boolean') {
    merged.devServerOpen = flags.open;
  }

  return merged;
};
