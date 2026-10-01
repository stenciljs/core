import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('app-profile', () => {
  test('renders', async ({ page }) => {
    await page.setContent('<app-profile></app-profile>');

    const element = page.locator('app-profile');
    await expect(element).toHaveClass(/hydrated/);
  });

  test('displays the specified name', async ({ page }) => {
    await page.goto('/profile/joseph');

    const element = page.locator('app-profile ion-content p');
    await expect(element).toContainText('My name is Joseph.');
  });
});
