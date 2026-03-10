import type { Config } from '@stencil/core';

export const config: Config = {
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
  buildDist: true,
  extras: {
    lifecycleDOMEvents: true,
    experimentalSlotFixes: true,
    experimentalScopedSlotChanges: true,
  },
};
