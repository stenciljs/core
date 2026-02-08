import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Build config for internal/client/index.js (browser runtime)
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/client/index.ts'),
      name: '@stencil/core/internal/client',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/internal/client',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      external: (id) => {
        if (id === '@app-data' || id.startsWith('@app-data/')) return true;
        if (id === '@app-globals' || id.startsWith('@app-globals/')) return true;
        if (id === '@utils/shadow-css') return true;
        return false;
      },
      output: {
        preserveModules: false,
        paths: {
          '@app-data': '@stencil/core/internal/app-data',
          '@app-globals': '@stencil/core/internal/app-globals',
          '@utils/shadow-css': './shadow-css.js',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@platform': resolve(__dirname, 'src/client/index.ts'),
      '@runtime': resolve(__dirname, 'src/runtime'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
});
