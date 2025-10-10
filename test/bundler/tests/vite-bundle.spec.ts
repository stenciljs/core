import { test, expect } from '@playwright/test';

test('should load content from dynamic import', async ({ page }) => {
  await page.goto('/');

  const shadowText = await page.locator('my-component').evaluate((el) => el.shadowRoot?.textContent?.trim());

  await expect(shadowText).toBe("Hello, World! I'm Stencil 'Don't call me a framework' JS");
});


