import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

// Scenario "sass": plain-CSS stencil-* imports in a Sass partial, compressed output
export const config: Config = {
  namespace: 'globalstyle',
  plugins: [sass({ outputStyle: 'compressed' })],
  outputTargets: [
    {
      type: 'global-style',
      input: './styles/sass/global.scss',
      fileName: 'global.css',
      copyToLoaderBrowser: false,
    },
    { type: 'loader-bundle' },
    { type: 'standalone' },
  ],
};
