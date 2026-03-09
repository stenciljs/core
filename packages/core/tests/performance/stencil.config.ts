import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'app',
  minifyJs: false,
  taskQueue: 'async',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
};
