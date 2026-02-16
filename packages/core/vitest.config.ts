import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { stencilVitestPlugin } from './src/testing/vitest-stencil-plugin';

const __dirname = import.meta.dirname

export default defineConfig({
  plugins: [stencilVitestPlugin()],
  resolve: {
    alias: {
      'virtual:app-data': resolve(__dirname, 'src/testing/app-data.ts'),
      'virtual:app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
      'virtual:platform': resolve(__dirname, 'src/testing/platform/index.ts'),
      // Ensure transpiled components resolve to source (same plt instance)
      '@stencil/core/testing': resolve(__dirname, 'src/testing/index.ts'),
      '@stencil/core': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    // globals: true,
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
  },
});
