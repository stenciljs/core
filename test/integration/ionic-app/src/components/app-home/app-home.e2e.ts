import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('app-home', () => {
  test('renders', async ({ page }) => {
    await page.setContent('<app-home></app-home>');

    const element = page.locator('app-home');
    await expect(element).toHaveClass(/hydrated/);
  });

  test('contains a "Profile Page" button', async ({ page }) => {
    await page.setContent('<app-home></app-home>');

    const element = page.locator('app-home ion-content ion-button');
    await expect(element).toHaveText('Profile page');
  });
});
