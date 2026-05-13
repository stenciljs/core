import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestExternalRuntime',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'standalone',
      dir: 'dist/custom-elements',
      externalRuntime: true,
      skipInDev: false,
    },
  ],
};
