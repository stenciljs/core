import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestInvisiblePrehydrationFalse',
  devServer: {
    port: 3337,
  },
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
