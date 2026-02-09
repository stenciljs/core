import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

const skipDts = process.env.STENCIL_SKIP_DTS === 'true';

/**
 * Build config for runtime/server/index.js (SSR/hydration runtime)
 *
 * v5 breaking change: hydrate → server (clearer naming)
 */
export default defineConfig({
  plugins: [
    stencilVirtualModules({
      // Server bundle externalizes all virtual modules - they're provided at runtime
      external: {
        'app-data': '@stencil/core/runtime/app-data',
        'app-globals': '@stencil/core/runtime/app-globals',
        'platform': '@stencil/core/runtime/client',
      },
    }),
    !skipDts &&
      dts({
        outDir: 'dist/runtime/server',
        entryRoot: 'src/server',
        include: ['src/server/**/*.ts'],
        exclude: ['**/*.spec.ts', '**/*.test.ts', '**/test/**'],
      }),
  ].filter(Boolean),
  build: {
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/server/platform/index.ts'),
      name: '@stencil/core/runtime/server',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/runtime/server',
    emptyOutDir: true,
    sourcemap: true,
    target: 'node18',
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
