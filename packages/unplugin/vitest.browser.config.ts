// Requires `pnpm build` in packages/unplugin before first run.
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import { stencilVite } from './dist/index.mjs';

export default defineConfig({
  plugins: [stencilVite({})],
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['test/browser.spec.ts'],
  },
});
