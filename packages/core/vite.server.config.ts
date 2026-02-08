import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Build config for internal/server/index.js (SSR/hydration runtime)
 * 
 * v5 breaking change: hydrate → server (clearer naming)
 */
export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/server/platform/index.ts'),
      name: '@stencil/core/internal/server',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist/internal/server',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: 'node18',
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('node:')) return true;
        if (id === '@stencil/mock-doc') return true;
        if (id === '@platform' || id.startsWith('@platform/')) return true;
        if (id === '@app-data' || id.startsWith('@app-data/')) return true;
        if (id === '@app-globals' || id.startsWith('@app-globals/')) return true;
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      // For server, @platform is the server platform (not client)
      '@platform': resolve(__dirname, 'src/server/platform/index.ts'),
      '@runtime': resolve(__dirname, 'src/runtime'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
});
