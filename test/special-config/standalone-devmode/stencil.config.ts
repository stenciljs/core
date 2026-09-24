import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestStandAloneDevMode',
  outputTargets: [
    {
      type: 'www',
      bundleMode: 'standalone',
    },
  ],
};
