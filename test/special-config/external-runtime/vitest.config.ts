import { resolve } from 'path';
import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      {
        test: {
          name: 'standalone-no-app-data',
          include: ['src/**/*.no-app-data.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-standalone.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'standalone-with-app-data',
          include: ['src/**/*.app-data.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-standalone.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          alias: {
            '@stencil/core/app-data': resolve(__dirname, 'dist/collection/app-data.js'),
          },
        },
      },
      {
        test: {
          name: 'loader-no-app-data',
          include: ['src/**/*.no-app-data.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-loader.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'loader-with-app-data',
          include: ['src/**/*.app-data.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-loader.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          alias: {
            '@stencil/core/app-data': resolve(__dirname, 'dist/collection/app-data.js'),
          },
        },
      },
    ],
  },
});
