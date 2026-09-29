import { postcss } from '@stencil-community/postcss';
import { Config } from '@stencil/core';
import postcssImport from 'postcss-import';

// Scenario "postcss": stencil-* imports in a partial, with postcss-import told to skip them
export const config: Config = {
  namespace: 'globalstyle',
  plugins: [
    postcss({
      plugins: [postcssImport({ filter: (path: string) => !path.startsWith('stencil-') })],
    }),
  ],
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
