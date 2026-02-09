import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Build config for runtime/app-globals/index.js
 *
 * Provides global state management
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/app-globals/index.ts'),
      name: '@stencil/core/runtime/app-globals',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime/app-globals',
    emptyOutDir: true,
    sourcemap: true,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      output: {
        preserveModules: false,
      },
    },
  },
});
