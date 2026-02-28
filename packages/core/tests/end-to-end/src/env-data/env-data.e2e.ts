import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('env-data e2e', () => {
  test('should display environment data', async ({ page }) => {
    await page.setContent('<env-data></env-data>');

    const element = page.locator('env-data');

    // Verify the component renders with hydrate flag
    await expect(element).toHaveAttribute('custom-hydrate-flag', '');

    // Verify environment variables are displayed
    await expect(element.locator('p').nth(0)).toContainText('foo:');
    await expect(element.locator('p').nth(1)).toContainText('HOST:');
  });
});
