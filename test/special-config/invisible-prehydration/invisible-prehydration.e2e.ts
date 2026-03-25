import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

/**
 * Tests that when invisiblePrehydration is set to false in stencil.config.ts,
 * the CSS that normally hides components until they're hydrated is NOT added.
 */
test.describe('invisible-prehydration-false', () => {
  test('the style element will not be placed in the head', async ({ page }) => {
    // Navigate to the built index.html
    await page.goto('/');

    // Wait for the component to be present
    await page.waitForSelector('prehydrated-styles');

    // Verify the component renders its content
    const component = page.locator('prehydrated-styles');
    await expect(component).toContainText('prehydrated-styles');

    // Verify NO data-styles style elements are in the head
    // (these would normally hide components until hydration)
    const styleCount = await page.evaluate(() => {
      return document.head.querySelectorAll('style[data-styles]').length;
    });
    expect(styleCount).toBe(0);
  });
});
