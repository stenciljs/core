import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Build config for internal/index.js (type definitions)
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/runtime/index.ts'),
      name: '@stencil/core/internal',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/internal',
    emptyOutDir: false,
    sourcemap: !!process.env.DEBUG,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('node:')) return true;
        // Note: @platform, @app-data, @app-globals are NOT externalized
        // They get resolved via aliases and bundled inline
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      '@platform': resolve(__dirname, 'src/client'),
      '@runtime': resolve(__dirname, 'src/runtime'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@app-data': resolve(__dirname, 'src/app-data'),
      '@app-globals': resolve(__dirname, 'src/app-globals'),
    },
  },
});
