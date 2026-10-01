import { Config } from '@stencil/core';

// Scenario "explicit": one global-style output placing every stencil-* import itself
export const config: Config = {
  namespace: 'globalstyle',
  outputTargets: [
    {
      type: 'global-style',
      input: './styles/explicit/global.css',
      fileName: 'global.css',
      copyToLoaderBrowser: false,
    },
    { type: 'loader-bundle' },
    { type: 'standalone' },
  ],
};
