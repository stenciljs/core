import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TypeTests',
  srcDir: 'src',
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist',
    },
  ],
};
