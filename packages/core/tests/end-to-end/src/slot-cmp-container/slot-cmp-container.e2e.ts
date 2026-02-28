import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('Slots', () => {
  test('should render the slots in the correct order', async ({ page }) => {
    await page.setContent('<slot-cmp-container></slot-cmp-container>');

    const element = page.locator('slot-cmp-container');
    const shadowContent = await element.evaluate((el) => el.shadowRoot?.textContent ?? '');
    expect(shadowContent).toContain('OneTwoThree');
  });
});
