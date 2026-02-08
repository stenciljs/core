import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for @stencil/core/compiler/utils
 * 
 * Exports compiler utilities for use by CLI and other tools
 */
export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/utils/compiler-exports.ts'),
      name: '@stencil/core/compiler/utils',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/compiler/utils',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: 'node18',
    rollupOptions: {
      external: [
        /^node:/,
        'typescript',
        'rollup',
        '@stencil/mock-doc',
      ],
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      '@app-data': resolve(__dirname, 'src/app-data'),
      '@app-globals': resolve(__dirname, 'src/app-globals'),
      '@runtime': resolve(__dirname, 'src/runtime'),
      '@platform': resolve(__dirname, 'src/client'),
    },
  },
});
