import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'copytask',
  outputTargets: [
    {
      type: 'dist-custom-elements',
      copy: [
        {
          src: './utils/**',
          dest: './dist/utilsExtra',
        },
      ],
    },
    {
      type: 'dist',
    },
  ],
};
