import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { stencilVitestPlugin } from './src/testing/vitest-stencil-plugin';

const __dirname = import.meta.dirname

export default defineConfig({
  plugins: [stencilVitestPlugin()],
  resolve: {
    alias: {
      'virtual:app-data': resolve(__dirname, 'src/app-data/index.ts'),
      'virtual:app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
      'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
    },
  },
  test: {
    globals: true,
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
  },
});
