import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize',
  hashFileNames: false,
  outputTargets: [
    { type: 'loader-bundle' },
    {
      type: 'standalone',
      autoLoader: true,
      externalRuntime: false,
    },
  ],
  enableCache: false,
};
