import { expect } from '@playwright/test';
import { createConfig, matchers } from '@stencil/playwright';

// Add custom Stencil matchers to Playwright assertions
expect.extend(matchers);

export default createConfig({}, { cwd: import.meta.dirname });