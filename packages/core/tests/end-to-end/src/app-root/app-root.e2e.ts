import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('goto root url', () => {
  test('have custom hydrate flags and css', async ({ page }) => {
    await page.goto('/');

    const elm = page.locator('app-root');
    await expect(elm).toHaveAttribute('custom-hydrate-flag');

    // Check computed style for opacity
    const opacity = await elm.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');

    // Check head style element contains hydrate flag styles
    const headStyleContent = await page.locator('head style[data-styles]').innerHTML();
    expect(headStyleContent).toContain('{opacity:0}[custom-hydrate-flag]{opacity:1}');
  });

  test('should navigate to the index.html page w/out url searchParams', async ({ page }) => {
    // go to the root webpage
    await page.goto('/');

    // select the "prop-cmp" element within the page
    // and verify its text content
    const elm = page.locator('prop-cmp').locator('div');
    await expect(elm).toHaveText(
      'Hello, my name is Stencil JS. My full name being Mr Stencil JS. I like to wear life preservers.',
    );

    // Screenshot comparison using Playwright's built-in API
    await expect(page).toHaveScreenshot('navigate-to-homepage.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 400, height: 250 },
    });
  });

  test('should navigate to the index.html page with custom url searchParams', async ({ page }) => {
    await page.goto('/?first=Doc&last=Brown&clothes=lab coats');

    const elm = page.locator('prop-cmp').locator('div');
    await expect(elm).toHaveText('Hello, my name is Doc Brown. My full name being Mr Doc Brown. I like to wear lab coats.');

    await expect(page).toHaveScreenshot('navigate-to-homepage-with-querystrings.png');
  });

  test('should apply global style when navigating to root page', async ({ page }) => {
    await page.goto('/');

    const elm = page.locator('app-root');

    // Get computed styles
    const styles = await elm.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderColor: cs.borderColor,
        borderWidth: cs.borderWidth,
        borderStyle: cs.borderStyle,
      };
    });

    expect(styles.borderColor).toBe('rgb(255, 0, 0)');
    expect(styles.borderWidth).toBe('5px');
    expect(styles.borderStyle).toBe('dotted');
  });

  test('should apply global style when setting html', async ({ page }) => {
    await page.goto('/');

    const elm = page.locator('app-root');

    // Get app-root computed styles
    const appRootStyles = await elm.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderColor: cs.borderColor,
        borderWidth: cs.borderWidth,
        borderStyle: cs.borderStyle,
      };
    });

    expect(appRootStyles.borderColor).toBe('rgb(255, 0, 0)');
    expect(appRootStyles.borderWidth).toBe('5px');
    expect(appRootStyles.borderStyle).toBe('dotted');

    const videoElm = page.locator('#video');

    // Get video element computed styles
    const videoStyles = await videoElm.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderColor: cs.borderColor,
        borderWidth: cs.borderWidth,
        backgroundColor: cs.backgroundColor,
      };
    });

    // @Component() styles
    expect(videoStyles.borderColor).toBe('rgb(0, 0, 255)');
    expect(videoStyles.borderWidth).toBe('2px');

    // linaria styles
    expect(videoStyles.backgroundColor).toBe('rgba(0, 0, 255, 0.1)');
  });
});
