import { resolve } from 'path';
import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      {
        test: {
          name: 'no-app-data',
          include: ['src/**/*.no-app-data.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
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
          name: 'with-app-data',
          include: ['src/**/*.app-data.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          alias: {
            '@stencil/core/runtime/app-data': resolve(__dirname, 'dist/collection/app-data.js'),
          },
        },
      },
    ],
  },
});
