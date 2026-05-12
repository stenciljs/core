import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize-shadow',
  outputTargets: [
    { type: 'loader-bundle' , hashFileNames: false},
    {
      type: 'standalone',
      externalRuntime: false,
    },
  ],
  enableCache: false,
};
