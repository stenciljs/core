import { postcss } from '@stencil-community/postcss';
import { Config } from '@stencil/core';
import postcssImport from 'postcss-import';

// Scenario "postcss-bare": postcss-import without a filter tries to resolve stencil-* imports -
// fails, with a hint pointing at its filter option
export const config: Config = {
  namespace: 'globalstyle',
  plugins: [postcss({ plugins: [postcssImport()] })],
  outputTargets: [
    {
      type: 'global-style',
      input: './styles/postcss/global.css',
      fileName: 'global.css',
      copyToLoaderBrowser: false,
    },
    { type: 'loader-bundle' },
  ],
};
