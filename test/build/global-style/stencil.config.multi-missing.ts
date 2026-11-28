import { Config } from '@stencil/core';

// Scenario "multi-missing": two global-style outputs, neither imports stencil-css-components -
// placement is ambiguous, so the build must fail
export const config: Config = {
  namespace: 'globalstyle',
  outputTargets: [
    { type: 'global-style', input: './styles/multi-missing/a.css', fileName: 'a.css' },
    { type: 'global-style', input: './styles/multi-missing/b.css', fileName: 'b.css' },
    { type: 'loader-bundle' },
  ],
};
