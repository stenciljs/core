import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for @stencil/core/testing
 *
 * Testing utilities (mocks, stubs) for Stencil compiler tests.
 * NOT for end-user testing - those use @stencil/vitest and @stencil/playwright.
 */
export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/testing/index.ts'),
      name: '@stencil/core/testing',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/testing',
    emptyOutDir: false,
    sourcemap: !!process.env.DEBUG,
    target: 'node18',
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('node:')) return true;
        // Dependencies
        if (id === 'typescript' || id === 'terser' || id === 'parse5') return true;
        // Workspace packages
        if (id === '@stencil/cli' || id === '@stencil/mock-doc') return true;
        // Node packages
        if (['resolve', 'glob', 'magic-string', 'rollup'].includes(id)) return true;
        if (id.startsWith('@rollup/')) return true;
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      '@utils': resolve(__dirname, 'src/utils'),
      '@app-data': resolve(__dirname, 'src/app-data'),
      '@app-globals': resolve(__dirname, 'src/app-globals'),
      '@stencil/core/compiler': resolve(__dirname, 'src/compiler'),
      '@stencil/core/runtime': resolve(__dirname, 'src/runtime'),
      '@platform': resolve(__dirname, 'src/client'),
      '@runtime': resolve(__dirname, 'src/runtime'),
      '@sys-api-node': resolve(__dirname, 'src/sys/node'),
      '@environment': resolve(__dirname, 'src/compiler/sys/environment.ts'),
      '@hydrate-factory': resolve(__dirname, 'src/server/runner/hydrate-factory.ts'),
    },
  },
});
