import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

const skipDts = process.env.STENCIL_SKIP_DTS === 'true';

/**
 * Vite config for @stencil/cli
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
    ssr: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@stencil/cli',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'node18',
    rollupOptions: {
      external: [
        /^node:/,
        '@stencil/core',
        '@stencil/core/compiler',
        '@stencil/core/compiler/utils',
        '@stencil/core/declarations',
        '@stencil/core/testing',
        '@stencil/core/dev-server',
        '@stencil/mock-doc',
        'typescript',
        'prompts',
      ],
      output: {
        preserveModules: false,
      },
    },
  },
});
