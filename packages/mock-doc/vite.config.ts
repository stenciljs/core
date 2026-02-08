import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for @stencil/mock-doc
 *
 * A standalone DOM implementation for SSR/hydration/testing.
 * No aliases - all imports are explicit.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@stencil/mock-doc',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: ['node18'],
    rollupOptions: {
      external: [/^node:/],
      output: {
        preserveModules: false,
      },
    },
  },
});
