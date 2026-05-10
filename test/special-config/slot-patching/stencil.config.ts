import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestSlotPatching',
  tsconfig: 'tsconfig.stencil.json',
  outputTargets: [
    {
      type: 'loader-bundle',
    },
  ],
  extras: {
    lightDomPatches: false,
  },
};
