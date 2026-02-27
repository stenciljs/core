import { test, expect } from '@playwright/test';

test.describe('vite-bundle', () => {
  test('should load content from dynamic import', async ({ page }) => {
    await page.goto('http://localhost:3333/');

    // Wait for the Stencil component to be defined and hydrated
    const component = page.locator('my-component');
    await expect(component).toBeVisible();

    // Check shadow DOM content
    const shadowContent = component.locator('div');
    await expect(shadowContent).toContainText("Hello, World! I'm Stencil 'Don't call me a framework' JS");
  });
});
