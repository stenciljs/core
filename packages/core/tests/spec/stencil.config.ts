import type { Config } from '@stencil/core';

export const config: Config = {
  tsconfig: 'tsconfig.stencil.json',
  namespace: 'TestApp',
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist/lazy',
    },
    {
      type: 'dist-custom-elements',
      dir: 'dist/custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      autoLoader: true,
    },
  ],
  globalScript: 'src/global.ts',
  globalStyle: 'src/global.css',
  buildDist: true,
  extras: {
    lifecycleDOMEvents: true,
    experimentalSlotFixes: true,
  },
};
