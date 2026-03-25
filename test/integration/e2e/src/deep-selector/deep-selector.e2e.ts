import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('Shadow DOM piercing', () => {
  test('can pierce through shadow DOM via Playwright locators', async ({ page }) => {
    await page.setContent(`
      <cmp-a></cmp-a>
    `);

    // Playwright automatically pierces shadow DOM with locator chains
    const spanCmpA = page.locator('cmp-a').locator('span').first();
    await expect(spanCmpA).toHaveText('I am in component A');

    const spanCmpB = page.locator('cmp-a').locator('cmp-b').locator('span').first();
    await expect(spanCmpB).toHaveText('I am in component B');

    const spanCmpC = page.locator('cmp-a').locator('cmp-b').locator('cmp-c').locator('span');
    await expect(spanCmpC).toHaveText('I am in component C');

    // we can skip through the shadow dom hierarchy
    const spanCmp = page.locator('cmp-a').locator('cmp-c').locator('span');
    await expect(spanCmp).toHaveText('I am in component C');
  });

  test('can pierce through shadow DOM with CSS selectors', async ({ page }) => {
    await page.setContent(`
      <cmp-a></cmp-a>
    `);

    // Playwright locators pierce shadow DOM automatically
    const spanCmpA = page.locator('cmp-a').locator('span').first();
    await expect(spanCmpA).toHaveText('I am in component A');

    const spanCmpB = page.locator('cmp-a').locator('cmp-b').locator('span').first();
    await expect(spanCmpB).toHaveText('I am in component B');

    const spanCmpC = page.locator('cmp-a').locator('div > cmp-b').locator('div cmp-c').locator('span');
    await expect(spanCmpC).toHaveText('I am in component C');

    // we can skip through the shadow dom hierarchy
    const spanCmp = page.locator('cmp-a').locator('cmp-c').locator('span');
    await expect(spanCmp).toHaveText('I am in component C');
  });

  test('can find multiple elements through shadow DOM', async ({ page }) => {
    await page.setContent(`
      <cmp-a></cmp-a>
    `);

    // Get all spans within cmp-a (piercing shadow DOM)
    const spans = page.locator('cmp-a').locator('span');
    await expect(spans).toHaveCount(3);

    const allSpans = await spans.all();
    await expect(allSpans[0]).toHaveText('I am in component A');
    await expect(allSpans[1]).toHaveText('I am in component B');
    await expect(allSpans[2]).toHaveText('I am in component C');

    // Get spans within cmp-b (which includes cmp-c)
    const spansCmpB = page.locator('cmp-a').locator('cmp-b').locator('span');
    await expect(spansCmpB).toHaveCount(2);

    const cmpBSpans = await spansCmpB.all();
    await expect(cmpBSpans[0]).toHaveText('I am in component B');
    await expect(cmpBSpans[1]).toHaveText('I am in component C');

    // Get spans only within cmp-c
    const spansCmpC = page.locator('cmp-a').locator('cmp-b').locator('cmp-c').locator('span');
    await expect(spansCmpC).toHaveCount(1);
    await expect(spansCmpC).toHaveText('I am in component C');

    // Skip through the shadow dom hierarchy
    const spansCmp = page.locator('cmp-a').locator('cmp-c').locator('span');
    await expect(spansCmp).toHaveCount(1);
    await expect(spansCmp).toHaveText('I am in component C');
  });
});
