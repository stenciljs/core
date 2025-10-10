import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npx vite preview --port 5173',
    cwd: path.join(__dirname, 'vite-bundle-test'),
    port: 5173,
    reuseExistingServer: !isCI,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});


