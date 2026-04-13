import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'SSRTests',
  devServer: {
    port: 3336,
  },
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'dist',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
    {
      type: 'dist-hydrate-script',
      skipInDev: false,
    },
  ],
  hydratedFlag: {
    name: 'custom-hydrate-flag',
    selector: 'attribute',
  },
  extras: {
    experimentalSlotFixes: true,
  },
};
