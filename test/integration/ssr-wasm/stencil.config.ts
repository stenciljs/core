import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestSsrWasm',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'ssr-wasm',
      dir: 'dist/ssr-wasm',
      // skipInDev defaults to true; for this test we always do a production build
    },
  ],
  srcDir: 'src',
};
