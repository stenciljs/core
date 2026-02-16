import { buildError, isString, join, normalizePath } from '@utils';
import { isAbsolute } from 'path';

import type * as d from '../../declarations';

export const validatePrerender = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  outputTarget: d.OutputTargetWww,
) => {
  if (!config.flags.ssr && !config.flags.prerender && config.flags.task !== 'prerender') {
    return;
  }

  outputTarget.baseUrl = normalizePath(outputTarget.baseUrl);

  if (!outputTarget.baseUrl.startsWith('http://') && !outputTarget.baseUrl.startsWith('https://')) {
    const err = buildError(diagnostics);
    err.messageText = `When prerendering, the "baseUrl" output target config must be a full URL and start with either "http://" or "https://". The config can be updated in the "www" output target within the stencil config.`;
  }

  try {
    new URL(outputTarget.baseUrl);
  } catch (e) {
    const err = buildError(diagnostics);
    err.messageText = `invalid "baseUrl": ${e}`;
  }

  if (!outputTarget.baseUrl.endsWith('/')) {
    outputTarget.baseUrl += '/';
  }

  if (isString(outputTarget.prerenderConfig)) {
    if (!isAbsolute(outputTarget.prerenderConfig)) {
      outputTarget.prerenderConfig = join(config.rootDir, outputTarget.prerenderConfig);
    }
  }
};
