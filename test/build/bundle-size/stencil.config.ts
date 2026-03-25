import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'bundlesize',
  hashFileNames: false,
  outputTargets: [
    { type: 'dist' }, 
    { 
      type: 'dist-custom-elements', 
      autoLoader: true, 
      externalRuntime: false 
    }
  ],
  enableCache: false,
};
