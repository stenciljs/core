import type { Config } from '../../internal/index.js';

export const config: Config = {
  namespace: 'TestAutoLoader',
  tsconfig: 'tsconfig-auto-loader.json',
  srcDir: 'auto-loader',
  outputTargets: [
    {
      type: 'dist-custom-elements',
      dir: 'test-components-autoloader',
      customElementsExportBehavior: 'single-export-module',
      autoLoader: true,
      externalRuntime: false,
    },
  ],
  buildDist: true,
};
