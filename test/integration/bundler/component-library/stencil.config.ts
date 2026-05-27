import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'component-library',
  outputTargets: [
    {
      type: 'loader-bundle',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
    },
  ],
  extras: {
    enableImportInjection: true,
  },
};
