import type { Config } from '../../internal/index.js';

export const config: Config = {
  namespace: 'TestTSTarget',
  tsconfig: 'tsconfig-es2022.json',
  srcDir: 'ts-target-props',
  outputTargets: [
    {
      type: 'dist',
      dir: './test-ts-target-output/dist',
    },
    {
      type: 'dist-custom-elements',
      dir: './test-ts-target-output/custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    {
      type: 'dist-hydrate-script',
      dir: './test-ts-target-output/hydrate',
    },
  ],
  sourceMap: true,
};
