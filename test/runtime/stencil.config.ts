import { sass } from '@stencil/sass';
import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'TestApp',
  tsconfig: 'tsconfig.stencil.json',
  excludeComponents: ['excluded-component', 'exclude-*'],
  outputTargets: [
    {
      type: 'loader-bundle',
      dir: 'dist/lazy',
      skipInDev: false,
    },
    {
      type: 'standalone',
      dir: 'dist/custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      autoLoader: true,
      skipInDev: false,
    },
  ],
  plugins: [
    sass({
      quietDeps: true,
      silenceDeprecations: ['import'],
    }),
  ],
  globalScript: 'src/global.ts',
  globalStyle: 'src/global.css',
  extras: {
    lifecycleDOMEvents: true,
    additionalTagTransformers: true,
    lightDomPatches: {
      childNodes: true,
      cloneNode: true,
      domMutations: true,
      textContent: true,
    },
  },
};
