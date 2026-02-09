import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

const skipDts = process.env.STENCIL_SKIP_DTS === 'true';

/**
 * Build config for runtime/client/index.js (browser runtime)
 */
export default defineConfig({
  plugins: [
    stencilVirtualModules({
      resolve: {
        'platform': resolve(__dirname, 'src/client/index.ts'),
      },
      external: {
        'app-data': '@stencil/core/runtime/app-data',
        'app-globals': '@stencil/core/runtime/app-globals',
      },
    }),
    !skipDts &&
      dts({
        outDir: 'dist/runtime/client',
        entryRoot: 'src/client',
        include: ['src/client/**/*.ts'],
        exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
      }),
  ].filter(Boolean),
  build: {
    lib: {
      entry: resolve(__dirname, 'src/client/index.ts'),
      name: '@stencil/core/runtime/client',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime/client',
    emptyOutDir: true,
    sourcemap: true,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      output: {
        preserveModules: false,
      },
    },
  },
});
