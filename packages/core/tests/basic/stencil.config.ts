import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'test-basic',
  hashFileNames: false,
  minifyCss: false,
  minifyJs: false,
  outputTargets: [
    { type: 'dist' }, 
    { type: 'dist-custom-elements', autoLoader: true, externalRuntime: false },
    { type: 'www', serviceWorker: null },
  ],
  enableCache: false,
};
