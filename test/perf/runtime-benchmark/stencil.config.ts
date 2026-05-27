import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'perfbenchmark',
  sourceMap: false,
  outputTargets: [
    {
      type: 'www',
      empty: true,
      hashFileNames: false,
    },
  ],
  enableCache: false,
};
