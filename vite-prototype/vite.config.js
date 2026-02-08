import { defineConfig } from 'vite';
import { stencilPlugin } from './plugin.js';
import path from 'path';

export default defineConfig({
  plugins: [stencilPlugin()],
  resolve: {
    alias: {
      // Point Stencil runtime imports to the built runtime
      '@stencil/core/internal/client': path.resolve('../internal/client/index.js'),
      '@stencil/core/internal/app-data': path.resolve('../internal/app-data/index.js'),
      '@stencil/core/internal/app-globals': path.resolve('../internal/app-globals/index.js'),
      '@stencil/core/internal/hydrate': path.resolve('../internal/hydrate/index.js'),
      '@stencil/core': path.resolve('../internal/stencil-core/index.js'),
    },
  },
  server: {
    fs: {
      // Allow serving files from Stencil's internal directory
      allow: ['..'],
    },
  },
});
