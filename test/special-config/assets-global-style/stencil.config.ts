import type { Config } from '@stencil/core';

/**
 * Test configuration for explicit assets and global-style output targets.
 *
 * This tests:
 * - Explicit `global-style` output with custom directory and explicit `input`
 * - Multiple `global-style` outputs with different inputs
 * - Custom `fileName` property
 * - Explicit `assets` output with custom directory
 * - `copyToLoaderBrowser: false` (opt out of backwards compat copy)
 * - Both outputs coexisting in the same custom directory
 * - `inject: 'none'` - styles NOT injected into shadow DOMs (default)
 * - `inject: 'client'` - styles ARE injected into shadow DOMs at runtime
 */
export const config: Config = {
  namespace: 'TestAssetsGlobalStyle',
  tsconfig: 'tsconfig.stencil.json',
  devServer: {
    port: 3338,
  },
  // Note: We use explicit `input` on outputs instead of globalStyle config
  outputTargets: [
    {
      type: 'loader-bundle',
      dir: 'dist/loader-bundle',
    },
    // First global-style: inject: 'none' (default) - NOT injected into shadow DOMs
    {
      type: 'global-style',
      input: './src/global.css',
      dir: 'dist/custom-assets',
      copyToLoaderBrowser: false,
      inject: 'none', // Explicit default - styles must be loaded externally
    },
    // Second global-style: inject: 'client' - IS injected into shadow DOMs
    {
      type: 'global-style',
      input: './src/utilities.css',
      fileName: 'utils.css',
      dir: 'dist/custom-assets',
      copyToLoaderBrowser: false,
      inject: 'client', // Styles are injected into component shadow DOMs
    },
    // Explicit assets with custom config
    {
      type: 'assets',
      dir: 'dist/custom-assets',
    },
  ],
};
