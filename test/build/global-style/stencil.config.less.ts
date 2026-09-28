import { less } from '@stencil-community/less';
import { Config } from '@stencil/core';

// Scenario "less": (css) stencil-* imports in a Less partial
export const config: Config = {
  namespace: 'globalstyle',
  plugins: [less()],
  outputTargets: [
    {
      type: 'global-style',
      input: './styles/less/global.less',
      fileName: 'global.css',
      copyToLoaderBrowser: false,
    },
    { type: 'loader-bundle' },
    { type: 'standalone' },
  ],
};
