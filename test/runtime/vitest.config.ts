import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      // Tests against lazy-loaded 'dist' output
      {
        test: {
          name: 'lazy',
          include: ['src/**/*.spec.{ts,tsx}'],
          exclude: ['src/scer/**'],
          setupFiles: ['./vitest-setup-dist.ts'],
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
      // Tests against bundled 'dist-custom-elements' output
      {
        test: {
          name: 'standalone',
          include: ['src/**/*.spec.{ts,tsx}'],
          exclude: ['src/scer/**'],
          setupFiles: ['./vitest-setup-custom-elements.ts'],
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
      // Scoped Custom Element Registry tests - lazy loader
      {
        test: {
          name: 'scer-lazy',
          include: ['src/scer/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-scer-lazy.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      // Scoped Custom Element Registry tests - standalone
      {
        test: {
          name: 'scer-standalone',
          include: ['src/scer/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-scer-standalone.ts'],
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
