import { isAbsolute } from 'path';
import type * as d from '@stencil/core';

import {
  buildError,
  COPY,
  DIST_LAZY,
  isBoolean,
  isNumber,
  isOutputTargetLoaderBundle,
  isOutputTargetStandalone,
  isOutputTargetWww,
  isString,
  join,
  STANDALONE,
} from '../../../utils';
import { getAbsolutePath } from '../config-utils';
import {
  DEFAULT_HASHED_FILENAME_LENGTH,
  MAX_HASHED_FILENAME_LENGTH,
  MIN_HASHED_FILENAME_LENGTH,
} from '../constants';
import { validateCopy } from '../validate-copy';
import { validatePrerender } from '../validate-prerender';
import { validateServiceWorker } from '../validate-service-worker';

export const validateWww = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  userOutputs: d.OutputTarget[],
) => {
  const userWwwOutputs = userOutputs.filter(isOutputTargetWww);

  // Auto-detect bundleMode based on configured primary output:
  // If standalone is configured but NOT loader-bundle, default to 'standalone'
  const hasLoaderBundle = userOutputs.some(isOutputTargetLoaderBundle);
  const hasStandalone = userOutputs.some(isOutputTargetStandalone);
  const defaultBundleMode = !hasLoaderBundle && hasStandalone ? 'standalone' : 'loader';

  // Apply default bundleMode to www outputs that don't have it explicitly set
  for (const wwwOutput of userWwwOutputs) {
    if (wwwOutput.bundleMode == null) {
      wwwOutput.bundleMode = defaultBundleMode;
    }
  }

  if (config.prerender && userWwwOutputs.length === 0) {
    const err = buildError(diagnostics);
    err.messageText = `You need at least one "www" output target configured in your stencil.config.ts, when the "--prerender" flag is used`;
  }

  return userWwwOutputs.reduce(
    (
      outputs: (
        | d.OutputTargetWww
        | d.OutputTargetDistLazy
        | d.OutputTargetStandalone
        | d.OutputTargetCopy
      )[],
      o,
    ) => {
      const outputTarget = validateWwwOutputTarget(config, o, diagnostics);
      outputs.push(outputTarget);

      const buildDir = outputTarget.buildDir;

      if (outputTarget.bundleMode === 'standalone') {
        // Add standalone output target with auto-loader
        outputs.push({
          type: STANDALONE,
          dir: buildDir,
          empty: false, // www handles emptying its own directory
          externalRuntime: false,
          // inline runtime for simpler single-file deployment
          autoLoader: {
            fileName: config.fsNamespace,
            autoStart: true,
          },
          skipInDev: false, // always build for www
        });
      } else {
        // Default: Add dist-lazy output target
        outputs.push({
          type: DIST_LAZY,
          dir: buildDir,
          esmDir: buildDir,
          isBrowserBuild: true,
          hashFileNames: outputTarget.hashFileNames,
          hashedFileNameLength: outputTarget.hashedFileNameLength,
        });
      }

      // Copy for user-defined copy tasks
      outputs.push({
        type: COPY,
        dir: buildDir,
      });

      // Copy for www
      outputs.push({
        type: COPY,
        dir: outputTarget.appDir,
        copy: validateCopy(outputTarget.copy, [
          { src: 'assets', warn: false },
          { src: 'manifest.json', warn: false },
        ]),
      });

      return outputs;
    },
    [],
  );
};

const validateWwwOutputTarget = (
  config: d.ValidatedConfig,
  outputTarget: d.OutputTargetWww,
  diagnostics: d.Diagnostic[],
) => {
  // Normalize bundleMode (default to 'loader')
  if (outputTarget.bundleMode !== 'standalone') {
    outputTarget.bundleMode = 'loader';
  }

  if (!isString(outputTarget.baseUrl)) {
    outputTarget.baseUrl = '/';
  }

  if (!outputTarget.baseUrl.endsWith('/')) {
    // Make sure the baseUrl always finish with "/"
    outputTarget.baseUrl += '/';
  }

  outputTarget.dir = getAbsolutePath(config, outputTarget.dir || 'www');

  // Fix "dir" to account
  const pathname = new URL(outputTarget.baseUrl, 'http://localhost/').pathname;
  outputTarget.appDir = join(outputTarget.dir, pathname);
  if (outputTarget.appDir.endsWith('/') || outputTarget.appDir.endsWith('\\')) {
    outputTarget.appDir = outputTarget.appDir.substring(0, outputTarget.appDir.length - 1);
  }

  if (!isString(outputTarget.buildDir)) {
    outputTarget.buildDir = 'build';
  }

  if (!isAbsolute(outputTarget.buildDir)) {
    outputTarget.buildDir = join(outputTarget.appDir, outputTarget.buildDir);
  }

  if (!isString(outputTarget.indexHtml)) {
    outputTarget.indexHtml = 'index.html';
  }

  if (!isAbsolute(outputTarget.indexHtml)) {
    outputTarget.indexHtml = join(outputTarget.appDir, outputTarget.indexHtml);
  }

  if (!isBoolean(outputTarget.empty)) {
    outputTarget.empty = true;
  }

  if (!isBoolean(outputTarget.hashFileNames)) {
    outputTarget.hashFileNames = !config.devMode;
  }
  if (!isNumber(outputTarget.hashedFileNameLength)) {
    outputTarget.hashedFileNameLength = DEFAULT_HASHED_FILENAME_LENGTH;
  }
  if (outputTarget.hashedFileNameLength < MIN_HASHED_FILENAME_LENGTH) {
    const err = buildError(diagnostics);
    err.messageText = `www hashedFileNameLength must be at least ${MIN_HASHED_FILENAME_LENGTH} characters`;
  }
  if (outputTarget.hashedFileNameLength > MAX_HASHED_FILENAME_LENGTH) {
    const err = buildError(diagnostics);
    err.messageText = `www hashedFileNameLength cannot be more than ${MAX_HASHED_FILENAME_LENGTH} characters`;
  }

  validatePrerender(config, diagnostics, outputTarget);
  validateServiceWorker(config, outputTarget);

  return outputTarget;
};
