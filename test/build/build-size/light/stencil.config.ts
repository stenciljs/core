import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize-non-shadow',
  outputTargets: [
    { type: 'loader-bundle', hashFileNames: false },
    {
      type: 'standalone',
      externalRuntime: false,
    },
    {
      type: 'global-style',
      input: 'src/global-style.css',
    },
  ],
  enableCache: false,
};
