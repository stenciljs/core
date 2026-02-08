import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for @stencil/cli
 *
 * Source is in packages/cli/src/
 */
export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@stencil/cli',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: 'node18',
    rollupOptions: {
      external: [
        /^node:/,
        '@stencil/core',
        '@stencil/core/compiler',
        '@stencil/core/testing', // Being removed in v5
        '@stencil/core/dev-server', // Being replaced by Vite in v5
        '@stencil/mock-doc',
        'typescript',
        'prompts',
      ],
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      // CLI uses utils/declarations from core
      '@utils': resolve(__dirname, '../core/src/utils'),
      '@app-data': resolve(__dirname, '../core/src/app-data'),
      '@app-globals': resolve(__dirname, '../core/src/app-globals'),
      '@platform': resolve(__dirname, '../core/src/client'),
      '@runtime': resolve(__dirname, '../core/src/runtime'),
      '@stencil/core/declarations': resolve(__dirname, '../core/src/declarations'),
      // Relative imports from old src/ structure
      '../declarations': resolve(__dirname, '../core/src/declarations'),
      '../../declarations': resolve(__dirname, '../core/src/declarations'),
      '../compiler': resolve(__dirname, '../core/src/compiler'),
      '../../compiler': resolve(__dirname, '../core/src/compiler'),
      '../version': resolve(__dirname, '../core/src/version'),
      '../../version': resolve(__dirname, '../core/src/version'),
    },
  },
});
