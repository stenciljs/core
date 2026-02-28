import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('dom interaction e2e tests', () => {
  test('should click button in shadow root', async ({ page }) => {
    await page.setContent(`
      <dom-interaction></dom-interaction>
    `);

    const button = page.locator('dom-interaction').locator('.click');

    await expect(button).toHaveText('Click');

    await button.click();

    await expect(button).toHaveText('Was Clicked');
  });

  test('should focus button in shadow root', async ({ page }) => {
    await page.setContent(`
      <dom-interaction></dom-interaction>
    `);

    const button = page.locator('dom-interaction').locator('.focus');

    await expect(button).toHaveText('Focus');

    await button.tap();

    await expect(button).toHaveText('Has Focus');
  });

  test('should tap button in shadow root', async ({ page }) => {
    await page.setContent(`
      <dom-interaction></dom-interaction>
    `);

    const button = page.locator('dom-interaction').locator('.tap');

    await expect(button).toHaveText('Tap');

    await button.tap();

    await expect(button).toHaveText('Was Tapped');
  });

  test('should use press() to enter text in an input in the shadow root', async ({ page }) => {
    await page.setContent(`
      <dom-interaction></dom-interaction>
    `);

    const input = page.locator('dom-interaction').locator('.input');

    await expect(input).toHaveValue('');

    await input.press('8');
    await input.press('8');
    await input.press(' ');

    await page.keyboard.down('Shift');
    await input.press('KeyM');
    await input.press('KeyP');
    await input.press('KeyH');
    await page.keyboard.up('Shift');

    await expect(input).toHaveValue('88 MPH');
  });

  test('should use fill() to enter text in an input in the shadow root', async ({ page }) => {
    await page.setContent(`
      <dom-interaction></dom-interaction>
    `);

    const input = page.locator('dom-interaction').locator('.input');

    await expect(input).toHaveValue('');

    await input.fill('88 MPH');

    await expect(input).toHaveValue('88 MPH');
  });
});
