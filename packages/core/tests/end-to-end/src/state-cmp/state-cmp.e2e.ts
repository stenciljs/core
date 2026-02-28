import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('@State', () => {
  test('should render all weekdays', async ({ page }) => {
    await page.setContent(`
      <state-cmp></state-cmp>
    `);

    const label = page.locator('state-cmp').locator('label');
    await expect(label).toHaveText('What is your favorite day?');

    const buttons = page.locator('state-cmp').locator('button');
    await expect(buttons).toHaveCount(7);
    await expect(buttons.nth(0)).toHaveText('Sunday');
    await expect(buttons.nth(1)).toHaveText('Monday');
    await expect(buttons.nth(2)).toHaveText('Tuesday');
    await expect(buttons.nth(3)).toHaveText('Wednesday');
    await expect(buttons.nth(4)).toHaveText('Thursday');
    await expect(buttons.nth(5)).toHaveText('Friday');
    await expect(buttons.nth(6)).toHaveText('Saturday');
  });

  test('should select a day and check computed styles', async ({ page }) => {
    await page.setContent(`
      <state-cmp></state-cmp>
    `);

    const buttons = page.locator('state-cmp').locator('button');
    await buttons.nth(6).click();

    await expect(buttons.nth(6)).toHaveClass(/selected/);

    const selectedStyle = await buttons.nth(6).evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    expect(selectedStyle.fontWeight).toBe('700');
    expect(selectedStyle.color).toBe('rgb(0, 0, 255)');

    await expect(buttons.nth(1)).not.toHaveClass(/selected/);

    const unselectedStyle = await buttons.nth(1).evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    });
    expect(unselectedStyle.fontWeight).not.toBe('700');
    expect(unselectedStyle.color).toBe('rgb(0, 0, 0)');
  });
});
