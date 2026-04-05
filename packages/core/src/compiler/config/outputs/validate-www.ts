import { isAbsolute } from 'path';
import type * as d from '@stencil/core';

import {
  buildError,
  COPY,
  DIST_GLOBAL_STYLES,
  DIST_LAZY,
  isBoolean,
  isOutputTargetWww,
  isString,
  join,
  WWW,
} from '../../../utils';
import { getAbsolutePath } from '../config-utils';
import { validateCopy } from '../validate-copy';
import { validatePrerender } from '../validate-prerender';
import { validateServiceWorker } from '../validate-service-worker';

export const validateWww = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  userOutputs: d.OutputTarget[],
) => {
  const hasOutputTargets = userOutputs.length > 0;
  const userWwwOutputs = userOutputs.filter(isOutputTargetWww);

  if (!hasOutputTargets) {
    userWwwOutputs.push({ type: WWW });
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
        | d.OutputTargetCopy
        | d.OutputTargetDistGlobalStyles
      )[],
      o,
    ) => {
      const outputTarget = validateWwwOutputTarget(config, o, diagnostics);
      outputs.push(outputTarget);

      // Add dist-lazy output target
      const buildDir = outputTarget.buildDir;
      outputs.push({
        type: DIST_LAZY,
        dir: buildDir,
        esmDir: buildDir,
        isBrowserBuild: true,
      });

      // Copy for dist
      outputs.push({
        type: COPY,
        dir: buildDir,
        copyAssets: 'dist',
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

      // Generate global style with original name
      outputs.push({
        type: DIST_GLOBAL_STYLES,
        file: join(buildDir, `${config.fsNamespace}.css`),
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

  validatePrerender(config, diagnostics, outputTarget);
  validateServiceWorker(config, outputTarget);

  return outputTarget;
};
