import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestSibling',
  outputTargets: [
    {
      type: 'loader-bundle',
    },
  ],
};
