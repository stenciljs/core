import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Build config for runtime/app-data/index.js
 *
 * Provides tree-shaking magic for build conditionals
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/app-data/index.ts'),
      name: '@stencil/core/runtime/app-data',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime/app-data',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      external: (id) => {
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
});
