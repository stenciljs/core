import { expect } from '@playwright/test';
import { createConfig, matchers } from '@stencil/playwright';

// Add custom Stencil matchers to Playwright assertions
expect.extend(matchers);

export default createConfig(
  {
    snapshotPathTemplate: '{testFileDir}/__snapshots__/{testFileName}{arg}{ext}',
  },
  { cwd: import.meta.dirname },
);