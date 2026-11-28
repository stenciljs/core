import { Config } from '@stencil/core';

// Scenario "single-implicit": one global-style output with no stencil-* imports - they're
// prepended to it. No standalone output, so hydrate CSS stays with the loader.
export const config: Config = {
  namespace: 'globalstyle',
  outputTargets: [
    {
      type: 'global-style',
      input: './styles/single-implicit/global.css',
      fileName: 'global.css',
      copyToLoaderBrowser: false,
    },
    { type: 'loader-bundle' },
  ],
};
