import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'copytask',
  outputTargets: [
    {
      type: 'standalone',
      copy: [
        {
          src: './utils/**',
          dest: './dist/utilsExtra',
        },
      ],
    },
    {
      type: 'loader-bundle',
      // esmLoaderPath: 'mouse'
    },
  ],
};
