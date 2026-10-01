import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'SSRTests',
  devServer: {
    port: 3336,
  },
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'loader-bundle',
    },
    {
      type: 'www',
    },
    {
      // served by the dev server for tests that need per-component `defineCustomElement` control
      type: 'standalone',
      dir: 'www/standalone',
      skipInDev: false,
    },
    {
      type: 'ssr',
      skipInDev: false,
    },
  ],
  hydratedFlag: {
    name: 'custom-hydrate-flag',
    selector: 'attribute',
  },
};
