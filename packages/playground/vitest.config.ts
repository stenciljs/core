// Requires `pnpm build` in packages/playground before first run.
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Matches how a real static host must serve dist/vendor/* - module scripts
  // loaded from inside the sandboxed preview iframe's opaque origin require
  // CORS headers on the resource, same as any cross-origin ESM import.
  // Verified: test fails without this (ok: false), not just theoretical.
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
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
