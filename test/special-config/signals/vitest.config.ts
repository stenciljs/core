import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      {
        test: {
          name: 'loader',
          include: ['src/**/*.spec.{ts,tsx}'],
          exclude: ['src/**/*.node.spec.ts'],
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
          name: 'standalone',
          include: ['src/**/*.spec.{ts,tsx}'],
          exclude: ['src/**/*.node.spec.ts'],
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
          name: 'node',
          include: ['src/**/*.node.spec.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
          },
        },
      },
    ],
  },
});
