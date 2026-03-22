import { Config } from '@stencil/core';

export const config: Config = {
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [{ type: 'www', serviceWorker: null }],
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/global/app.css',
  hashFileNames: false,
};
