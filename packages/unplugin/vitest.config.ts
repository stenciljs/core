import { defineConfig } from 'vitest/config';

import { stencilSpecPage } from './src/index.js';

export default defineConfig({
  plugins: [stencilSpecPage()],
  test: {
    include: [
      'src/**/*.spec.ts',
      'test/build.spec.ts',
      'test/docs.spec.ts',
      'test/spec-page.spec.ts',
    ],
  },
});
