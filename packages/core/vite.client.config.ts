import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

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
    dts({
      tsconfigPath: resolve(__dirname, 'tsconfig.build.json'),
      outDir: 'dist/runtime/client',
      include: ['src/client/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/client/index.ts'),
      name: '@stencil/core/runtime/client',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime/client',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: ['es2022', 'chrome79', 'edge79', 'firefox70', 'safari14'],
    rollupOptions: {
      output: {
        preserveModules: false,
      },
    },
  },
});
