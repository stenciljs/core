import { defineVitestConfig } from '@stencil/vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  test: {
    projects: [
      // Tests against lazy-loaded 'dist' output
      {
        test: {
          name: 'dist',
          include: ['src/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-dist.ts'],
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
          name: 'custom-elements',
          include: ['src/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup-custom-elements.ts'],
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
