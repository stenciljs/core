import { createRequire } from 'node:module';
import type { Config } from '@stencil/core';

const require = createRequire(import.meta.url);

export const config: Config = {
  namespace: 'stencil-playground',
  srcDir: 'src',
  sourceMap: true,
  outputTargets: [{ type: 'loader-bundle' }],
  // typescript, postcss, and @rollup/pluginutils all stay external in
  // @stencil/core/compiler/browser and reference these Node builtins
  nodeResolve: {
    alias: {
      path: require.resolve('./build/path-polyfill-shim.js'),
      'node:path': require.resolve('./build/path-polyfill-shim.js'),
      os: require.resolve('os-browserify/browser'),
      // Aliased directly to the real package (not a wrapper)
      process: require.resolve('process/browser'),
      // Statically referenced but never actually called in the browser
      fs: require.resolve('./build/empty-shim.js'),
      crypto: require.resolve('./build/empty-shim.js'),
      url: require.resolve('./build/empty-shim.js'),
    },
  },
};
