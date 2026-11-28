import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

/**
 * Tests the `inject` option on `global-style` output targets.
 *
 * - `inject: 'none'` (default): styles are NOT injected into component shadow DOMs
 * - `inject: 'client'`: styles ARE injected into component shadow DOMs at runtime
 *
 * This test uses two global-style outputs:
 * - global.css with `inject: 'none'` (has --test-color CSS variable)
 * - utilities.css with `inject: 'client'` (has .u-hidden, .u-flex classes)
 */
test.describe('global-style inject option', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <injected-style-cmp></injected-style-cmp>
    `);
  });
  test('inject: client should inject styles into shadow DOM', async ({ page }) => {
    // Wait for the shadow DOM component to be present
    await page.waitForSelector('injected-style-cmp');

    // Check that utilities.css styles (inject: 'client') are applied in the shadow DOM
    const isHidden = await page.evaluate(() => {
      const cmp = document.querySelector('injected-style-cmp');
      if (!cmp?.shadowRoot) return null;
      const hiddenSpan = cmp.shadowRoot.querySelector('.u-hidden') as HTMLElement;
      if (!hiddenSpan) return null;
      return window.getComputedStyle(hiddenSpan).display;
    });

    // .u-hidden { display: none !important } should be applied
    expect(isHidden).toBe('none');
  });

  test('inject: client should apply flex styles from injected stylesheet', async ({ page }) => {
    await page.waitForSelector('injected-style-cmp');

    const isFlex = await page.evaluate(() => {
      const cmp = document.querySelector('injected-style-cmp');
      if (!cmp?.shadowRoot) return null;
      const flexSpan = cmp.shadowRoot.querySelector('.u-flex') as HTMLElement;
      if (!flexSpan) return null;
      return window.getComputedStyle(flexSpan).display;
    });

    // .u-flex { display: flex } should be applied
    expect(isFlex).toBe('flex');
  });

  test('inject: none should NOT inject styles into shadow DOM', async ({ page }) => {
    await page.waitForSelector('injected-style-cmp');

    // Check that global.css styles (inject: 'none') are NOT in the shadow DOM
    // The --test-color CSS variable from global.css should not be defined in shadow root
    const hasTestColor = await page.evaluate(() => {
      const cmp = document.querySelector('injected-style-cmp');
      if (!cmp?.shadowRoot) return null;

      // Check if any adopted stylesheet contains --test-color
      const stylesheets = cmp.shadowRoot.adoptedStyleSheets || [];
      for (const sheet of stylesheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText.includes('--test-color')) {
              return true;
            }
          }
        } catch {
          // May throw for cross-origin stylesheets
        }
      }
      return false;
    });

    // --test-color from global.css (inject: 'none') should NOT be in shadow DOM
    expect(hasTestColor).toBe(false);
  });

  test('shadow DOM should have adopted stylesheets from injected styles', async ({ page }) => {
    await page.waitForSelector('injected-style-cmp');

    const adoptedCount = await page.evaluate(() => {
      const cmp = document.querySelector('injected-style-cmp');
      if (!cmp?.shadowRoot) return 0;
      return cmp.shadowRoot.adoptedStyleSheets?.length || 0;
    });

    // Should have at least one adopted stylesheet from inject: 'client'
    expect(adoptedCount).toBeGreaterThan(0);
  });
});
