import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'globalstyle',
  outputTargets: [
    {
      type: 'global-style',
      input: './src/global.css',
      fileName: 'global.css',
      copyToLoaderBrowser: false,
    },
    {
      type: 'loader-bundle',
    },
  ],
};
