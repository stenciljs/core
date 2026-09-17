import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'app',
  devServer: { port: 3336 },
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    { type: 'loader-bundle', skipInDev: false },
    { type: 'standalone', skipInDev: false },
  ],
};
