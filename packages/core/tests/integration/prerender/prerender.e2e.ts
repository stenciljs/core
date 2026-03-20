import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

/**
 * Tests prerendering functionality.
 * Verifies that components are correctly prerendered at build time,
 * lifecycle hooks fire in correct order, and scoped styles are applied.
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

  test('correct scoped styles applied after scripts kick in', async ({ page }) => {
    await page.goto('/prerender/index.html');
    await page.waitForSelector('cmp-scoped-a.hydrated');
    await verifyScopedStyles(page);
  });

  test('no-script: correct scoped styles applied before scripts kick in', async ({ page }) => {
    await page.goto('/prerender/index-no-script.html');
    await verifyScopedStyles(page);
  });

  test('root slots', async ({ page }) => {
    await page.goto('/prerender/index.html');

    // Test scoped component
    const scopedColor = await page.evaluate(() => {
      const scoped = document.querySelector('cmp-client-scoped');
      return getComputedStyle(scoped!.querySelector('section')!).color;
    });
    expect(scopedColor).toBe('rgb(255, 0, 0)');

    // Test shadow component
    await page.waitForSelector('cmp-client-shadow');

    const shadowColor = await page.evaluate(async () => {
      const shadow = document.querySelector('cmp-client-shadow');
      // Wait for shadow root to be populated
      await new Promise(resolve => setTimeout(resolve, 100));
      const article = shadow!.shadowRoot!.querySelector('article');
      return article ? getComputedStyle(article).color : null;
    });
    expect(shadowColor).toBe('rgb(0, 155, 0)');

    // Test nested text components
    const blueTextColor = await page.evaluate(() => {
      const shadow = document.querySelector('cmp-client-shadow');
      const blueText = shadow!.shadowRoot!.querySelector('cmp-text-blue');
      const textEl = blueText?.querySelector('text-blue');
      return textEl ? getComputedStyle(textEl).color : null;
    });
    expect(blueTextColor).toBe('rgb(0, 0, 255)');

    const greenTextColor = await page.evaluate(() => {
      const shadow = document.querySelector('cmp-client-shadow');
      const greenText = shadow!.shadowRoot!.querySelector('cmp-text-green');
      const textEl = greenText?.querySelector('text-green');
      return textEl ? getComputedStyle(textEl).color : null;
    });
    expect(greenTextColor).toBe('rgb(0, 255, 0)');
  });

  test('should render an svg child', async ({ page }) => {
    await page.goto('/prerender/index.html');

    const svgClass = await page.evaluate(() => {
      const testSvg = document.querySelector('test-svg');
      return testSvg?.className;
    });
    expect(svgClass).toContain('hydrated');
  });
});

async function verifyScopedStyles(page: any) {
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
}
