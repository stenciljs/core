import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('Querying non-existent element(s)', () => {
  test.describe('Shadow DOM', () => {
    test('returns no elements if the element does not exist', async ({ page }) => {
      await page.setContent(`
        <empty-cmp-shadow></empty-cmp-shadow>
      `);

      const elm = page.locator('empty-cmp-shadow').locator('.non-existent');
      await expect(elm).toHaveCount(0);
    });

    test('returns an empty collection if no elements match the selector', async ({ page }) => {
      await page.setContent(`
        <empty-cmp-shadow></empty-cmp-shadow>
      `);

      const elms = page.locator('empty-cmp-shadow').locator('.non-existent');
      await expect(elms).toHaveCount(0);
    });
  });

  test.describe('Light DOM', () => {
    test('returns no elements if the element does not exist', async ({ page }) => {
      await page.setContent(`
        <empty-cmp></empty-cmp>
      `);

      const elm = page.locator('empty-cmp').locator('.non-existent');
      await expect(elm).toHaveCount(0);
    });

    test('returns an empty collection if no elements match the selector', async ({ page }) => {
      await page.setContent(`
        <empty-cmp></empty-cmp>
      `);

      const elms = page.locator('empty-cmp').locator('.non-existent');
      await expect(elms).toHaveCount(0);
    });
  });
});
