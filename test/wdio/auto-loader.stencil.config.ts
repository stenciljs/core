import type { Config } from '../../internal/index.js';

export const config: Config = {
  namespace: 'TestAutoLoader',
  tsconfig: 'tsconfig-auto-loader.json',
  srcDir: 'auto-loader',
  outputTargets: [
    // Auto-loader output (mutation observer based lazy loading)
    {
      type: 'dist-custom-elements',
      dir: 'test-components-autoloader',
      customElementsExportBehavior: 'single-export-module',
      autoLoader: true,
      externalRuntime: false,
    },
    // Dist output for performance comparison (traditional lazy loading)
    {
      type: 'dist',
      dir: 'dist-autoloader-comparison',
    },
  ],
  buildDist: true,
};
