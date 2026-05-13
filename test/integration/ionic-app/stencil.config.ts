import { Config } from '@stencil/core';

export const config: Config = {
  devServer: {
    port: 3335,
  },
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [{ type: 'www', serviceWorker: null, hashFileNames: false }],
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/global/app.css',
};
