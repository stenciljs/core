import { test, expect } from '@playwright/test';

/**
 * Tests prerendering functionality.
 *
 * These tests run with JavaScript DISABLED to verify that content
 * is actually prerendered in the static HTML, not rendered client-side.
 */
test.describe('prerender', () => {
  test('server componentWillLoad order', async ({ page }) => {
    await page.goto('/prerender/index.html');

    const elm = page.locator('#server-componentWillLoad');
    await expect(elm).toHaveText(`CmpA server componentWillLoad
CmpD - a1-child server componentWillLoad
CmpD - a2-child server componentWillLoad
CmpD - a3-child server componentWillLoad
CmpD - a4-child server componentWillLoad
CmpB server componentWillLoad
CmpC server componentWillLoad
CmpD - c-child server componentWillLoad`);
  });

  test('server componentDidLoad order', async ({ page }) => {
    await page.goto('/prerender/index.html');

    const elm = page.locator('#server-componentDidLoad');
    await expect(elm).toHaveText(`CmpD - a1-child server componentDidLoad
CmpD - a2-child server componentDidLoad
CmpD - a3-child server componentDidLoad
CmpD - a4-child server componentDidLoad
CmpD - c-child server componentDidLoad
CmpC server componentDidLoad
CmpB server componentDidLoad
CmpA server componentDidLoad`);
  });

  test('scoped styles are prerendered', async ({ page }) => {
    await page.goto('/prerender/index.html');

    // Verify scoped styles are applied without JavaScript
    const styles = await page.evaluate(() => {
      const cmpScopedA = document.querySelector('cmp-scoped-a');
      const cmpScopedB = document.querySelector('cmp-scoped-b');

      return {
        scopedA: {
          bg: getComputedStyle(cmpScopedA!).backgroundColor,
          divFontSize: getComputedStyle(cmpScopedA!.querySelector('div')!).fontSize,
          pColor: getComputedStyle(cmpScopedA!.querySelector('p')!).color,
          scopedClassColor: getComputedStyle(cmpScopedA!.querySelector('.scoped-class')!).color,
        },
        scopedB: {
          bg: getComputedStyle(cmpScopedB!).backgroundColor,
          divFontSize: getComputedStyle(cmpScopedB!.querySelector('div')!).fontSize,
          pColor: getComputedStyle(cmpScopedB!.querySelector('p')!).color,
          scopedClassColor: getComputedStyle(cmpScopedB!.querySelector('.scoped-class')!).color,
        },
      };
    });

    // cmp-scoped-a styles
    expect(styles.scopedA.bg).toBe('rgb(0, 128, 0)');
    expect(styles.scopedA.divFontSize).toBe('14px');
    expect(styles.scopedA.pColor).toBe('rgb(128, 0, 128)');
    expect(styles.scopedA.scopedClassColor).toBe('rgb(0, 0, 255)');

    // cmp-scoped-b styles
    expect(styles.scopedB.bg).toBe('rgb(128, 128, 128)');
    expect(styles.scopedB.divFontSize).toBe('18px');
    expect(styles.scopedB.pColor).toBe('rgb(0, 128, 0)');
    expect(styles.scopedB.scopedClassColor).toBe('rgb(255, 255, 0)');
  });

  test('html dir attribute set by beforeHydrate hook', async ({ page }) => {
    await page.goto('/prerender/index.html');

    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('ltr');
  });

  test('title set by afterHydrate hook', async ({ page }) => {
    await page.goto('/prerender/index.html');

    const title = await page.title();
    expect(title).toContain('Url:');
  });

  test('svg child is prerendered', async ({ page }) => {
    await page.goto('/prerender/index.html');

    const testSvg = page.locator('test-svg');
    await expect(testSvg).toBeVisible();

    // SVG element should exist in the prerendered HTML
    const svg = testSvg.locator('svg');
    await expect(svg).toBeVisible();
  });
});
