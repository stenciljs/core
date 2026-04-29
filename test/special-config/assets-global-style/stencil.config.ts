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
 */
export const config: Config = {
  namespace: 'TestAssetsGlobalStyle',
  // Note: We use explicit `input` on outputs instead of globalStyle config
  outputTargets: [
    {
      type: 'loader-bundle',
      dir: 'dist/loader-bundle',
    },
    // First global-style: explicit input, uses input basename as fileName
    {
      type: 'global-style',
      input: './src/global.css',
      dir: 'dist/custom-assets',
      copyToLoaderBrowser: false, // Opt out of backwards compat copy
    },
    // Second global-style: explicit input with custom fileName
    {
      type: 'global-style',
      input: './src/utilities.css',
      fileName: 'utils.css', // Custom fileName (different from input basename)
      dir: 'dist/custom-assets',
      copyToLoaderBrowser: false,
    },
    // Explicit assets with custom config
    {
      type: 'assets',
      dir: 'dist/custom-assets',
    },
  ],
};
