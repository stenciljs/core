// Requires `pnpm build` in packages/unplugin before first run.
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import { stencilVite } from './dist/index.mjs';

const MODULE_EXPORT_FIXTURES = '**/fixtures/module-export/**';

export default defineConfig({
  plugins: [
    stencilVite({ exclude: ['node_modules/**', MODULE_EXPORT_FIXTURES] }),
    stencilVite({
      include: [MODULE_EXPORT_FIXTURES],
      transpileOptions: { componentExport: 'module' },
    }),
  ],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['test/browser.test.ts', 'test/build-flag-mock.test.ts', 'test/module-export.test.ts'],
  },
});
