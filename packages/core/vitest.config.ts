import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'virtual:app-data': resolve(__dirname, 'src/app-data/index.ts'),
      'virtual:app-globals': resolve(__dirname, 'src/app-globals/index.ts'),
      'virtual:platform': resolve(__dirname, 'src/client/index.ts'),
    },
  },
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
});
