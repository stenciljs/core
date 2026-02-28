import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('dom visible e2e tests', () => {
  test('isVisible()', async ({ page }) => {
    await page.setContent(`
      <dom-visible></dom-visible>
    `);

    const article = page.locator('article');
    await expect(article).not.toBeVisible();

    const button = page.locator('button');
    await button.click();

    await expect(article).toBeVisible();
  });

  test('waitForVisible()', async ({ page }) => {
    await page.setContent(`
      <dom-visible></dom-visible>
    `);

    const article = page.locator('article');

    await expect(article).not.toBeVisible();

    const button = page.locator('button');
    await button.click();

    // Wait for article to become visible
    await article.waitFor({ state: 'visible' });

    await expect(article).toBeVisible();
  });
});
