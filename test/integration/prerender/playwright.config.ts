import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3334',
    trace: 'on-first-retry',
    // Disable JavaScript to truly test prerendered content
    javaScriptEnabled: false,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx serve www -l 3334',
    port: 3334,
    reuseExistingServer: !process.env.CI,
    cwd: import.meta.dirname,
  },
});
