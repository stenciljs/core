import { expect } from '@playwright/test';
import { createConfig, matchers } from '@stencil/playwright';

// Add custom Stencil matchers to Playwright assertions
expect.extend(matchers);

export default createConfig({
  // Use default Stencil configuration which will:
  // - Start the Stencil dev server automatically
  // - Configure the base URL from stencil.config.ts
  // - Set testMatch to '*.e2e.ts'
});
