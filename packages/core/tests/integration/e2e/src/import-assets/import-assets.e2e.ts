import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('import assets', () => {
  test('should import .txt file', async ({ page }) => {
    await page.setContent('<import-assets></import-assets>');

    const txt = page.locator('#txt');
    await expect(txt).toHaveText('My .txt File');

    const whateverHtml = page.locator('#whatever-html');
    await expect(whateverHtml).toHaveText('<whatever></whatever>');

    const ionicSvgUrl = page.locator('#ionic-svg-url');
    const src = await ionicSvgUrl.getAttribute('src');
    expect(src).toContain('data:image/svg+xml;base64,');

    const ionicSvgText = page.locator('#ionic-svg-text');
    await expect(ionicSvgText).toContainText('<svg xmlns=');
  });
});
