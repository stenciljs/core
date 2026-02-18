import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  dts: true,
  clean: true,
  // sourcemap: true,
  external: [/^node:/],
})

