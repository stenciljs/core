import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

const skipDts = process.env.STENCIL_SKIP_DTS === 'true';

/**
 * Build config for runtime/index.js (type definitions)
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
        outDir: 'dist/runtime',
        entryRoot: 'src/runtime',
        include: ['src/runtime/**/*.ts'],
        exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
      }),
  ].filter(Boolean),
  build: {
    lib: {
      entry: resolve(__dirname, 'src/runtime/index.ts'),
      name: '@stencil/core/runtime',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime',
    emptyOutDir: false,
    sourcemap: true,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('node:')) return true;
        if (id.startsWith('@stencil/')) return true;
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
});
