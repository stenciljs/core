import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

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
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.build.json'),
      outDir: 'dist/runtime',
      entryRoot: 'src/runtime',
      include: ['src/runtime/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/runtime/index.ts'),
      name: '@stencil/core/runtime',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime',
    emptyOutDir: false,
    sourcemap: !!process.env.DEBUG,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('node:')) return true;
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
});
