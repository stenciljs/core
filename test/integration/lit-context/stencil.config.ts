import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'app',
  devServer: { port: 3336 },
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    { type: 'www', hashFileNames: false },
    {
      type: 'standalone',
      dir: 'www/build/standalone',
      customElementsExportBehavior: 'auto-define-custom-elements',
    },
  ],
};
