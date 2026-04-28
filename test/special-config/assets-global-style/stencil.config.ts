import type { Config } from '@stencil/core';

/**
 * Test configuration for explicit assets and global-style output targets.
 *
 * This tests:
 * - Explicit `global-style` output with custom directory
 * - Explicit `assets` output with custom directory
 * - `copyToLoaderBrowser: false` (opt out of backwards compat copy)
 * - Both outputs coexisting in the same custom directory
 */
export const config: Config = {
  namespace: 'TestAssetsGlobalStyle',
  globalStyle: './src/global.css',
  outputTargets: [
    {
      type: 'loader-bundle',
      dir: 'dist/loader-bundle',
    },
    // Explicit global-style with custom config
    {
      type: 'global-style',
      dir: 'dist/custom-assets',
      copyToLoaderBrowser: false, // Opt out of backwards compat copy
    },
    // Explicit assets with custom config
    {
      type: 'assets',
      dir: 'dist/custom-assets',
    },
  ],
};
