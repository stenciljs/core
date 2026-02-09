import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

const skipDts = process.env.STENCIL_SKIP_DTS === 'true';

/**
 * Vite config for @stencil/mock-doc
 *
 * A standalone DOM implementation for SSR/hydration/testing.
 * No aliases - all imports are explicit.
 */
export default defineConfig({
  plugins: [
    !skipDts &&
      dts({
        outDir: 'dist',
        entryRoot: 'src',
        include: ['src/**/*.ts'],
        exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
      }),
  ].filter(Boolean),
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@stencil/mock-doc',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: ['node18'],
    rollupOptions: {
      external: [/^node:/],
      output: {
        preserveModules: false,
      },
    },
  },
});
