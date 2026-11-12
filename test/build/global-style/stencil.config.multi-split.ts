import { Config } from '@stencil/core';

// Scenario "multi-split": two global-style outputs sharing the stencil-* imports between them,
// some inside a partial
export const config: Config = {
  namespace: 'globalstyle',
  outputTargets: [
    { type: 'global-style', input: './styles/multi-split/a.css', fileName: 'a.css' },
    { type: 'global-style', input: './styles/multi-split/b.css', fileName: 'b.css' },
    { type: 'loader-bundle' },
    { type: 'standalone' },
  ],
};
