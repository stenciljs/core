import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

function checkSorted(arr: string[]) {
  return arr.every((value, index, array) => index === 0 || value >= array[index - 1]);
}

test.describe('page fixture tests', () => {
  test('first test', async ({ page }) => {
    await page.setContent('<html><body></body></html>');
    const p = page.locator('html');
    await expect(p).not.toBeNull();
  });

  test('second test', async ({ page }) => {
    await page.setContent('<html><body></body></html>');
    const p = page.locator('html');
    await expect(p).not.toBeNull();
  });
});

test.describe('sorts hydrated component styles', () => {
  test('generates style tags in alphabetical order', async ({ page }) => {
    const styleCount = await page.evaluate(() => document.querySelectorAll('style').length);
    expect(styleCount).toBe(0);

    await page.setContent(`
      <prop-cmp mode="ios"></prop-cmp>
    `);

    const newStyleCount = await page.evaluate(() => document.querySelectorAll('style').length);
    expect(newStyleCount).toBe(1);

    const styleContent = await page.evaluate(() => document.querySelector('style')?.innerHTML ?? '');

    /**
     * filter out the hydration class selector for the app-root component
     */
    const classSelector = styleContent
      .replace(/\}/g, '}\n')
      .trim()
      .split('\n')
      .map((c) => c.slice(0, c.indexOf('{')))
      .find((c) => c.includes('app-root'));

    if (classSelector) {
      expect(checkSorted(classSelector.split(','))).toBeTruthy();
    }
  });
});
