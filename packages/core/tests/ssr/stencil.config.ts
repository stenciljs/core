import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'SSRTests',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
    },
    {
      type: 'dist-hydrate-script',
    },
  ],
  hydratedFlag: {
    name: 'hydrated',
    selector: 'attribute',
  },
  extras: {
    experimentalSlotFixes: true,
  },
};
