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
        '@stencil/core/compiler/utils',
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
      // Map @utils to proper package export
      '@utils': '@stencil/core/compiler/utils',
      // Map local declarations to core exports
      '../declarations': '@stencil/core',
    },
  },
});
