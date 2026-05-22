import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not exist before build
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];
let resetSsrDocData: HydrateModule['resetSsrDocData'];

test.describe('signals + SSR', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not exist before build
    const mod = await import('../dist/ssr/index.js');
    renderToString = mod.renderToString;
    resetSsrDocData = mod.resetSsrDocData;
    resetSsrDocData();
  });

  test.describe('initial render', () => {
    test('renders signal-backed @State default value', async () => {
      const { html } = await renderToString('<signal-ssr-cmp></signal-ssr-cmp>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });
      expect(html ?? '').toContain('>0<');
    });

    test('renders with initialCount prop from attribute', async () => {
      const { html } = await renderToString('<signal-ssr-cmp initial-count="5"></signal-ssr-cmp>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });
      expect(html ?? '').toContain('>5<');
    });
  });

  test.describe('post-hydration reactivity', () => {
    test('counter increments after hydration via button click', async ({ page }) => {
      const { html } = await renderToString('<signal-ssr-cmp></signal-ssr-cmp>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      await page.setContent(html ?? '');

      const cmp = page.locator('signal-ssr-cmp');
      const inc = cmp.locator('.inc');

      await inc.click();
      await expect(cmp.locator('.count')).toHaveText('1');

      await inc.click();
      await expect(cmp.locator('.count')).toHaveText('2');
    });

    test('counter starts from initialCount prop and increments', async ({ page }) => {
      const { html } = await renderToString(
        '<signal-ssr-cmp initial-count="10"></signal-ssr-cmp>',
        { serializeShadowRoot: true, fullDocument: false },
      );

      await page.setContent(html ?? '');

      const cmp = page.locator('signal-ssr-cmp');
      await expect(cmp.locator('.count')).toHaveText('10');

      await cmp.locator('.inc').click();
      await expect(cmp.locator('.count')).toHaveText('11');
    });

    test('counter decrements after hydration', async ({ page }) => {
      const { html } = await renderToString('<signal-ssr-cmp initial-count="3"></signal-ssr-cmp>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      await page.setContent(html ?? '');

      const cmp = page.locator('signal-ssr-cmp');
      await cmp.locator('.dec').click();
      await expect(cmp.locator('.count')).toHaveText('2');
    });

    test('JS property update triggers re-render post-hydration', async ({ page }) => {
      const { html } = await renderToString('<signal-ssr-cmp></signal-ssr-cmp>', {
        serializeShadowRoot: true,
        fullDocument: false,
      });

      await page.setContent(html ?? '');

      await page.evaluate(() => {
        (document.querySelector('signal-ssr-cmp') as any).initialCount = 99;
      });

      await page.waitForFunction(() => {
        const el = document.querySelector('signal-ssr-cmp');
        return el?.shadowRoot?.querySelector('.count')?.textContent === '99';
      });

      await expect(page.locator('signal-ssr-cmp').locator('.count')).toHaveText('99');
    });
  });
});
