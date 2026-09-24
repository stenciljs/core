import { expect } from '@playwright/test';
import { createConfig, matchers } from '@stencil/playwright';

expect.extend(matchers);

export default createConfig({}, { cwd: import.meta.dirname });
