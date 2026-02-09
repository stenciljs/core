import { defineConfig } from 'vite';
import { resolve } from 'path';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

/**
 * Vite config for @stencil/core/compiler/utils
 *
 * Exports compiler utilities for use by CLI and other tools
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
  ],
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
        entryFileNames: 'index.js',
      },
    },
  },
});
