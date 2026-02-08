import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Build config for internal/app-data/index.js
 * 
 * Provides tree-shaking magic for build conditionals
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/app-data/index.ts'),
      name: '@stencil/core/internal/app-data',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/internal/app-data',
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
