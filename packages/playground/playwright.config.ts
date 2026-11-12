import { expect } from '@playwright/test';
import { createConfig, matchers } from '@stencil/playwright';

expect.extend(matchers);

export default createConfig(
  {
    testDir: './test',
    testMatch: '*.e2e.ts',
    webServer: {
      // copy-core-types.js must run before `stencil build` (writes files it compiles);
      // copy-vendor.js copies prebuilt vendor chunks into dist/vendor - same two steps
      // package.json's own `start` script runs before `stencil build --serve`. The
      // loader-bundle output target's namespace.esm.js (an auto-defining custom-elements
      // bundle, not the `loader/` distributable) is always generated, dev mode included.
      command:
        'node build/copy-core-types.js && node build/copy-vendor.js && npx stencil build --dev --watch --serve --no-open --testing',
    },
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    use: { trace: 'on-first-retry' },
  },
  { cwd: import.meta.dirname },
);
