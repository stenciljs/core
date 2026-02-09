import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

const skipDts = process.env.STENCIL_SKIP_DTS === 'true';

/**
 * Vite config for @stencil/core/testing
 *
 * Testing utilities (mocks, stubs) for Stencil compiler tests.
 * NOT for end-user testing - those use @stencil/vitest and @stencil/playwright.
 */
export default defineConfig({
  plugins: [
    stencilVirtualModules({
      resolve: {
        'app-data': resolve(__dirname, 'src/app-data/index.ts'),
        'app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
        'platform': resolve(__dirname, 'src/client/index.ts'),
      },
    }),
    !skipDts &&
      dts({
        outDir: 'dist/testing',
        entryRoot: 'src/testing',
        include: ['src/testing/**/*.ts'],
        exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
      }),
  ].filter(Boolean),
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
    sourcemap: true,
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
      // Package self-references for internal imports
      '@stencil/core/compiler': resolve(__dirname, 'src/compiler'),
      '@stencil/core/runtime': resolve(__dirname, 'src/runtime'),
    },
  },
});
