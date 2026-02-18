import { defineConfig } from 'tsdown'

export default defineConfig([
  // Server-side Node targets
  {
    entry: {
      index: 'src/server/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: 'node20',
    dts: true,
    clean: true,
    external: [/^node:/, '@stencil/core'],
    copy: [
      // Copy static assets needed by the dev server
      { from: 'templates', to: 'dist' },
      { from: 'static', to: 'dist' },
      { from: 'connector.html', to: 'dist' },
    ],
  },
  // Browser-side client (HMR, connector)
  {
    entry: {
      'client/index': 'src/client/index.ts',
    },
    outDir: 'dist',
    format: ['esm'],
    platform: 'browser',
    target: ['es2022'],
    dts: true,
    clean: false,
  },
])
