import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('load when html does not contain components', () => {
  test('test', async ({ page }) => {
    await page.setContent('<div>88 mph</div>');
    expect(1).toBe(1);
  });
});
