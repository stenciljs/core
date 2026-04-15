import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'component-library',
  outputTargets: [
    {
      type: 'loader-bundle',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  extras: {
    enableImportInjection: true,
  },
};
