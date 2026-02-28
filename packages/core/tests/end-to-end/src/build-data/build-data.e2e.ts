import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('build-data e2e', () => {
  test('should display build data flags', async ({ page }) => {
    await page.setContent('<build-data></build-data>');

    const element = page.locator('build-data');

    // Verify the component has the hydrate flag attribute
    await expect(element).toHaveAttribute('custom-hydrate-flag', '');

    // Verify the build data is displayed correctly
    await expect(element.locator('p').nth(0)).toHaveText('isDev: true');
    await expect(element.locator('p').nth(1)).toHaveText('isBrowser: true');
    await expect(element.locator('p').nth(2)).toHaveText('isTesting: true');
  });
});
