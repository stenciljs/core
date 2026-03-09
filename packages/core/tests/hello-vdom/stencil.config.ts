import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'HelloVDom',
  outputTargets: [{ type: 'dist' }, { type: 'www', serviceWorker: null }],
  devServer: {
    logRequests: true,
  },
  hashFileNames: false,
  hydratedFlag: null,
  taskQueue: 'immediate',
};
