import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestInvisiblePrehydrationFalse',
  tsconfig: 'tsconfig.stencil.json',
  invisiblePrehydration: false,
  outputTargets: [
    {
      type: 'www',
      empty: false,
      serviceWorker: null,
      dir: 'www',
    },
  ],
  srcDir: 'src',
};
