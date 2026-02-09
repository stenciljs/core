import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for @stencil/cli
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
        '@stencil/core/testing',
        '@stencil/core/dev-server',
        '@stencil/mock-doc',
        'typescript',
        'prompts',
      ],
      output: {
        preserveModules: false,
      },
    },
  },
});
