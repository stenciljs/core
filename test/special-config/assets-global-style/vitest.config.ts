import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      // Tests against lazy-loader browser output
      {
        test: {
          name: 'loader-browser',
          include: ['src/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-loader-browser.ts'],
          env: {
            TEST_PROJECT: 'dist',
          },
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      // Tests against lazy-loader external / bundler output
      {
        test: {
          name: 'loader-external',
          include: ['src/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-loader-external.ts'],
          env: {
            TEST_PROJECT: 'dist',
          },
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      // Tests against bundled 'standalone' output
      {
        test: {
          name: 'standalone',
          include: ['src/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-standalone.ts'],
          env: {
            TEST_PROJECT: 'custom-elements',
          },
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
