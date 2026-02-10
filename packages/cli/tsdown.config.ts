import { defineConfig } from 'tsdown'

const nodeExternals = [/^(?!virtual:)[^./]/]

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  external: [...nodeExternals],
})
