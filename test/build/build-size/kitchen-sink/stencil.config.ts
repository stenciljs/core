import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize-kitchen-sink',
  hashFileNames: false,
  outputTargets: [
    { type: 'loader-bundle' },
    {
      type: 'standalone',
      externalRuntime: false,
    },
    {
      type: 'ssr',
    },
  ],
  enableCache: false,
};
