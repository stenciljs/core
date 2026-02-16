import { isString } from '@utils';

import type * as d from '../../declarations';
import { nodeRequire } from '../sys/node-require';

export const getPrerenderConfig = (diagnostics: d.Diagnostic[], prerenderConfigPath: string) => {
  const prerenderConfig: d.PrerenderConfig = {};

  if (isString(prerenderConfigPath)) {
    const results = nodeRequire(prerenderConfigPath);
    diagnostics.push(...results.diagnostics);

    if (results.module != null && typeof results.module === 'object') {
      if (results.module.config != null && typeof results.module.config === 'object') {
        Object.assign(prerenderConfig, results.module.config);
      } else {
        Object.assign(prerenderConfig, results.module);
      }
    }
  }

  return prerenderConfig;
};
