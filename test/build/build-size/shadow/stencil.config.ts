import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize-shadow',
  hashFileNames: false,
  outputTargets: [
    { type: 'loader-bundle' },
    {
      type: 'standalone',
      externalRuntime: false,
    },
  ],
  enableCache: false,
};
