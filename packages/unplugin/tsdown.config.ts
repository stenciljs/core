import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: true,
  clean: true,
  deps: {
    neverBundle: [/^node:/, '@stencil/core'],
    skipNodeModulesBundle: false,
  },
});
