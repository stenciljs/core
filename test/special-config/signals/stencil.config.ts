import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestSignals',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    { type: 'loader-bundle', skipInDev: false },
    { type: 'standalone', skipInDev: false },
    { type: 'ssr', skipInDev: false },
  ],
  extras: {
    signalBacking: true,
  },
};
