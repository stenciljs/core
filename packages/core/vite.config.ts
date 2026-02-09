import { defineConfig } from 'vite';
import { resolve } from 'path';
import { stencilVirtualModules } from './vite-plugin-virtual-modules';

/**
 * Vite config for @stencil/core compiler
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
      entry: resolve(__dirname, 'src/compiler/index.ts'),
      name: '@stencil/core',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: !!process.env.DEBUG,
    target: 'node18',
    rollupOptions: {
      external: (id) => {
        if (id.includes('.spec.') || id.includes('/test/')) return true;
        if (id.startsWith('node:')) return true;
        // Dependencies (not bundled)
        if (id === 'typescript' || id === 'terser' || id === 'parse5') return true;
        // Workspace packages (external - resolved at runtime)
        if (id === '@stencil/cli') return true;
        // Node packages (external dependencies)
        // Note: ansi-colors/chalk bundled to avoid CJS interop issues
        if (['resolve', 'glob', 'magic-string', 'postcss', 'autoprefixer', 'rollup'].includes(id)) return true;
        if (id.startsWith('@babel/') || id.startsWith('@rollup/')) return true;
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      // Package self-references for internal imports
      '@stencil/core/compiler': resolve(__dirname, 'src/compiler'),
      '@stencil/core/runtime': resolve(__dirname, 'src/runtime'),
    },
  },
});
