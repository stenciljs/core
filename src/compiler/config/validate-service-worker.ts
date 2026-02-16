import { isString, join } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../declarations';

/**
 * Validate that a service worker configuration is valid, if it is present and
 * accounted for.
 *
 * Note that our service worker configuration / support is based on
 * Workbox, a package for automatically generating Service Workers to cache
 * assets on the client. More here: https://developer.chrome.com/docs/workbox/
 *
 * This function first checks that the service worker config set on the
 * supplied `OutputTarget` is not empty and that we are not currently in
 * development mode. In those cases it will early return.
 *
 * If we do find a service worker configuration we do some validation to ensure
 * that things are set up correctly.
 *
 * @param config the current, validated configuration
 * @param outputTarget the `www` outputTarget whose service worker
 * configuration we want to validate. **Note**: the `.serviceWorker` object
 * _will be mutated_ if it is present.
 */
export const validateServiceWorker = (config: d.ValidatedConfig, outputTarget: d.OutputTargetWww): void => {
  if (outputTarget.serviceWorker === false) {
    return;
  }
  if (config.devMode && !config.flags.serviceWorker) {
    outputTarget.serviceWorker = null;
    return;
  }

  if (outputTarget.serviceWorker === null) {
    outputTarget.serviceWorker = null;
    return;
  }

  if (!outputTarget.serviceWorker && config.devMode) {
    outputTarget.serviceWorker = null;
    return;
  }

  const globDirectory =
    typeof outputTarget.serviceWorker?.globDirectory === 'string'
      ? outputTarget.serviceWorker.globDirectory
      : outputTarget.appDir;

  outputTarget.serviceWorker = {
    ...outputTarget.serviceWorker,
    globDirectory,
    swDest: isString(outputTarget.serviceWorker?.swDest)
      ? outputTarget.serviceWorker.swDest
      : join(outputTarget.appDir ?? '', DEFAULT_FILENAME),
  };

  if (!Array.isArray(outputTarget.serviceWorker.globPatterns)) {
    if (typeof outputTarget.serviceWorker.globPatterns === 'string') {
      outputTarget.serviceWorker.globPatterns = [outputTarget.serviceWorker.globPatterns];
    } else if (typeof outputTarget.serviceWorker.globPatterns !== 'string') {
      outputTarget.serviceWorker.globPatterns = DEFAULT_GLOB_PATTERNS.slice();
    }
  }

  if (typeof outputTarget.serviceWorker.globIgnores === 'string') {
    outputTarget.serviceWorker.globIgnores = [outputTarget.serviceWorker.globIgnores];
  }

  outputTarget.serviceWorker.globIgnores = outputTarget.serviceWorker.globIgnores || [];

  addGlobIgnores(config, outputTarget.serviceWorker.globIgnores);

  outputTarget.serviceWorker.dontCacheBustURLsMatching = /p-\w{8}/;

  if (isString(outputTarget.serviceWorker.swSrc) && !isAbsolute(outputTarget.serviceWorker.swSrc)) {
    outputTarget.serviceWorker.swSrc = join(config.rootDir, outputTarget.serviceWorker.swSrc);
  }

  if (isString(outputTarget.serviceWorker.swDest) && !isAbsolute(outputTarget.serviceWorker.swDest)) {
    outputTarget.serviceWorker.swDest = join(outputTarget.appDir ?? '', outputTarget.serviceWorker.swDest);
  }
};

/**
 * Add file glob patterns to the `globIgnores` for files we don't want to cache
 * with the service worker.
 *
 * @param config the current, validated configuration
 * @param globIgnores list of file ignore patterns. **Note**: will be mutated.
 */
const addGlobIgnores = (config: d.ValidatedConfig, globIgnores: string[]) => {
  globIgnores.push(
    `**/host.config.json`, // the filename of the host configuration
    `**/*.system.entry.js`,
    `**/*.system.js`,
    `**/${config.fsNamespace}.js`,
    `**/${config.fsNamespace}.esm.js`,
    `**/${config.fsNamespace}.css`,
  );
};

const DEFAULT_GLOB_PATTERNS = ['*.html', '**/*.{js,css,json}'];

const DEFAULT_FILENAME = 'sw.js';
