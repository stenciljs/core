import { Config } from '@stencil/core';

// Scenario "none": no global-style output - un-imported stencil CSS gets its own {fsNamespace}.css
export const config: Config = {
  namespace: 'globalstyle',
  outputTargets: [{ type: 'loader-bundle' }, { type: 'standalone' }],
};
