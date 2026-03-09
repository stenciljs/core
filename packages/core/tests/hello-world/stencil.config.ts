import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'HelloWorld',
  outputTargets: [
    { type: 'dist' },
    { type: 'dist-hydrate-script' },
    {
      type: 'www',
      serviceWorker: null,
      baseUrl: 'https://helloworld.stencil.js.com/',
    },
  ],
  enableCache: false,
  hydratedFlag: null,
  hashFileNames: false,
};
