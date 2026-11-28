import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('no-config dev preview', () => {
  test('tsconfig.json is auto-generated when missing', () => {
    expect(existsSync(join(import.meta.dirname, '../tsconfig.json'))).toBe(true);
  });

  test('root redirects to /src/', async ({ request }) => {
    const response = await request.get('/');
    expect(response.url()).toContain('/src/');
  });

  test('/src/cmp-1/ shows 3 usage-based preview snippets', async ({ page }) => {
    await page.goto('/src/cmp-1/');
    await expect(page.locator('.component-preview')).toHaveCount(3);
  });

  test('global.css is linked and applied in the dev preview', async ({ page }) => {
    await page.goto('/src/cmp-1/');
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--nc-global-loaded').trim(),
    );
    expect(value).toBe('1');
  });

  test('/src/cmp-2/ shows 1 default bare-tag preview', async ({ page }) => {
    await page.goto('/src/cmp-2/');
    const preview = page.locator('.component-preview');
    await expect(preview).toHaveCount(1);
    expect(await preview.innerHTML()).toContain('<cmp-two class="hydrated"></cmp-two>');
  });

  test('/src/css-cmp/ previews the CSS-only component from its usage snippet', async ({ page }) => {
    await page.goto('/src/css-cmp/');
    await expect(page.locator('.component-header')).toHaveText('<css-badge>');
    await expect(page.locator('.component-description')).toHaveText('A dismissible badge.');
    // rendered from usage/example.md, not the bare-tag fallback
    await expect(page.locator('.component-preview css-badge')).toHaveCount(1);
    await expect(page.locator('.preview-note')).toHaveCount(0);
  });

  test('CSS-only component styles are auto-placed into the only global stylesheet', async ({
    page,
  }) => {
    await page.goto('/src/css-cmp/');
    // global.css has no @import "stencil-css-components" - the styles are prepended to it,
    // so there's still just the one stylesheet
    await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);

    const badge = page.locator('.component-preview css-badge');
    await expect(badge).toHaveCSS('padding', '4px');
    await badge.evaluate((el) => el.setAttribute('variant', 'danger'));
    await expect(badge).toHaveCSS('color', 'rgb(255, 0, 0)');
  });
});
