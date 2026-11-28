import type * as d from '@stencil/core';

import { isString } from '../../utils';
import { nodeRequire } from '../sys/node-require';

export const getPrerenderConfig = async (
  diagnostics: d.Diagnostic[],
  prerenderConfigPath: string,
) => {
  const prerenderConfig: d.PrerenderConfig = {};

  if (isString(prerenderConfigPath)) {
    const results = await nodeRequire(prerenderConfigPath);
    diagnostics.push(...results.diagnostics);

    const mod = results.module?.default ?? results.module;
    if (mod != null && typeof mod === 'object') {
      if (mod.config != null && typeof mod.config === 'object') {
        Object.assign(prerenderConfig, mod.config);
      } else {
        Object.assign(prerenderConfig, mod);
      }
    }
  }

  return prerenderConfig;
};
