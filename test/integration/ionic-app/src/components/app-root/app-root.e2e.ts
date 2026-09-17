import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('app-root', () => {
  test('renders', async ({ page }) => {
    await page.goto('/');

    const element = page.locator('app-root');
    await expect(element).toHaveClass(/hydrated/);
  });

  test('renders an ion-app', async ({ page }) => {
    await page.goto('/');

    const element = page.locator('app-root > ion-app');
    await expect(element).toHaveClass(/hydrated/);
  });

  test('renders the ion-split-pane as visible', async ({ page }) => {
    await page.goto('/');

    const splitPane = page.locator('app-root > ion-app > ion-split-pane');
    await expect(splitPane).toHaveClass(/split-pane-visible/);

    const menu = splitPane.locator('ion-menu');
    await expect(menu).toHaveClass(/menu-enabled/);

    const menuButton = page.locator('ion-menu-button');
    await expect(menuButton).toHaveClass(/button/);
  });
});
