import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize-kitchen-sink',
  outputTargets: [
    {
      type: 'loader-bundle',
      hashFileNames: false,
    },
    {
      type: 'standalone',
    },
    {
      type: 'ssr',
    },
    {
      type: 'global-style',
      input: 'src/global-style.css',
    },
  ],
  enableCache: false,
};
