import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ssrbenchmark',
  sourceMap: false,
  enableCache: false,
  outputTargets: [{ type: 'ssr' }],
};
