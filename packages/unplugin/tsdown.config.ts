import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts', docs: 'src/docs.ts' },
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  dts: true,
  clean: true,
});
