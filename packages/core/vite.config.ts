import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite config for @stencil/core compiler
 *
 * Source is now in packages/core/src/
 *
 * TODO: Remove aliases gradually - replace with relative imports
 */
export default defineConfig({
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
        // Note: @app-data, @platform, @runtime, @app-globals are NOT externalized
        // They get resolved via aliases and bundled inline
        return false;
      },
      output: {
        preserveModules: false,
      },
    },
  },
  resolve: {
    alias: {
      // TODO: Replace these with relative imports
      '@utils': resolve(__dirname, 'src/utils'),
      '@app-data': resolve(__dirname, 'src/app-data'),
      '@app-globals': resolve(__dirname, 'src/app-globals'),
      '@stencil/core/compiler': resolve(__dirname, 'src/compiler'),
      '@stencil/core/runtime': resolve(__dirname, 'src/runtime'),
      '@platform': resolve(__dirname, 'src/client'),
      '@runtime': resolve(__dirname, 'src/runtime'),
      '@sys-api-node': resolve(__dirname, 'src/sys/node'),
      '@environment': resolve(__dirname, 'src/compiler/sys/environment.ts'),
      '@hydrate-factory': resolve(__dirname, 'src/server/runner/hydrate-factory.ts'),
    },
  },
});
