import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../hydrate/index.mjs');
let renderToString: HydrateModule['renderToString'];
let resetHydrateDocData: HydrateModule['resetHydrateDocData'];

test.describe('styles and modes', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../hydrate/index.mjs');
    renderToString = mod.renderToString;
    resetHydrateDocData = mod.resetHydrateDocData;
    resetHydrateDocData();
  });

  test.describe('component modes', () => {
    test('renders components in ios mode', async ({ page }) => {
      const { html } = await renderToString('<prop-cmp first="Max" last="Mustermann"></prop-cmp>', {
        fullDocument: false,
        prettyHtml: true,
        modes: [() => 'ios'],
      });
      expect(html || '').toContain('<style sty-id="sc-prop-cmp-ios">');
      expect(html || '').toContain(';color:white;');

      await page.setContent(html || '');

      const div = page.locator('prop-cmp').locator('div');
      const color = await div.evaluate((el) => getComputedStyle(el).color);
      expect(color).toBe('rgb(255, 255, 255)');
    });

    test('renders components in md mode', async ({ page }) => {
      const { html } = await renderToString('<prop-cmp first="Max" last="Mustermann"></prop-cmp>', {
        fullDocument: false,
        prettyHtml: true,
        modes: [() => 'md'],
      });
      expect(html || '').toContain(';color:black;');

      await page.setContent(html || '');

      const div = page.locator('prop-cmp').locator('div');
      const color = await div.evaluate((el) => getComputedStyle(el).color);
      expect(color).toBe('rgb(0, 0, 0)');
    });
  });

  test.describe('scoped styles', () => {
    test('does not add multiple style tags', async ({ page }) => {
      const { html } = await renderToString(
        `
          <non-shadow-child></non-shadow-child>
        `,
      );
      await page.setContent(html || '');

      const styles = page.locator('style');
      await expect(styles).toHaveCount(2);

      const style0Text = await styles.nth(0).textContent();
      const style1Text = await styles.nth(1).textContent();

      expect(style0Text).not.toContain('.sc-non-shadow-child-h');
      expect(style1Text).toContain('.sc-non-shadow-child-h');
    });

    test('adds nested scoped styles to parent shadow root', async ({ page }) => {
      const { html } = await renderToString(
        `<div>
          <shadow-ssr-parent-cmp>
            <div slot="things">one</div>
            <div slot="things">2</div>
            <div slot="things">3</div>
          </shadow-ssr-parent-cmp>
        </div>`,
        {
          fullDocument: true,
          serializeShadowRoot: 'scoped',
        },
      );

      // Verify scoped child styles are in the SSR output (no flicker)
      expect(html || '').toContain('sc-scoped-ssr-child-cmp');
      expect(html || '').toContain('border: 3px solid red');

      await page.setContent(html || '');
      await page.waitForSelector('shadow-ssr-parent-cmp[custom-hydrate-flag]');

      // Verify the style is actually applied after hydration
      const borderColor = await page.evaluate(() => {
        const wrapCmp = document.querySelector('shadow-ssr-parent-cmp');
        const childCmp = wrapCmp?.shadowRoot?.querySelector('scoped-ssr-child-cmp');
        return childCmp ? getComputedStyle(childCmp).borderColor : null;
      });

      expect(borderColor).toBe('rgb(255, 0, 0)');
    });

    test("renders the styles of serializeShadowRoot `scoped` components when they're embedded in a shadow root", async ({
      page,
    }) => {
      const { html } = await renderToString(
        `
        <div>
          <wrap-ssr-shadow-cmp>Inside shadowroot</wrap-ssr-shadow-cmp>
          <ssr-shadow-cmp>Outside shadowroot</ssr-shadow-cmp>
        </div>`,
        {
          fullDocument: false,
          serializeShadowRoot: {
            default: 'declarative-shadow-dom',
            scoped: ['ssr-shadow-cmp'],
          },
        },
      );

      await page.setContent(html || '');

      const wrapCmp = page.locator('wrap-ssr-shadow-cmp');
      const scopedCmp = page.locator('ssr-shadow-cmp').first();
      const scopedNestCmp = page.locator('wrap-ssr-shadow-cmp').locator('ssr-shadow-cmp');

      const wrapCmpStyles = await wrapCmp.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, backgroundColor: cs.backgroundColor };
      });
      const scopedCmpStyles = await scopedCmp.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, backgroundColor: cs.backgroundColor };
      });
      const scopedNestCmpStyles = await scopedNestCmp.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, backgroundColor: cs.backgroundColor };
      });

      expect(wrapCmpStyles.color).toBe('rgb(255, 255, 255)'); // white
      expect(wrapCmpStyles.backgroundColor).toBe('rgb(0, 0, 255)'); // blue
      expect(scopedCmpStyles.color).toBe('rgb(255, 0, 0)'); // red
      expect(scopedCmpStyles.backgroundColor).toBe('rgb(255, 255, 0)'); // yellow
      expect(scopedNestCmpStyles.color).toBe('rgb(255, 0, 0)'); // red
      expect(scopedNestCmpStyles.backgroundColor).toBe('rgb(255, 255, 0)'); // yellow
    });

    test('supports styles for DSD', async () => {
      const { html } = await renderToString('<another-car-detail></another-car-detail>', {
        serializeShadowRoot: true,
        fullDocument: false,
        clientHydrateAnnotations: false,
      });
      expect(html || '').toContain(
        '<template shadowrootmode="open"><style sty-id="sc-another-car-detail">section{color:green}</style>',
      );
    });
  });

  test.describe('::part CSS selectors', () => {
    test('correctly renders ::part css selectors for scoped components in DSD', async ({
      page,
    }) => {
      const { html } = await renderToString(
        `<div>
          <part-wrap-ssr-shadow-cmp>Inside shadowroot</part-wrap-ssr-shadow-cmp>
        </div>`,
        {
          fullDocument: true,
          serializeShadowRoot: {
            default: 'declarative-shadow-dom',
            scoped: ['part-ssr-shadow-cmp'],
          },
        },
      );

      await page.setContent(html || '');
      await page.waitForSelector('part-wrap-ssr-shadow-cmp[custom-hydrate-flag]');

      const bgColor = await page.evaluate(() => {
        const partEl = document
          .querySelector('part-wrap-ssr-shadow-cmp')
          ?.shadowRoot?.querySelector('part-ssr-shadow-cmp')
          ?.shadowRoot?.querySelector('[part="container"]');
        return partEl ? getComputedStyle(partEl).backgroundColor : null;
      });

      expect(bgColor).toBe('rgb(255, 192, 203)'); // pink
    });

    test('correctly renders ::part css selectors for scoped components in scoped mode', async ({
      page,
    }) => {
      const { html } = await renderToString(
        `<div>
          <part-wrap-ssr-shadow-cmp>Inside shadowroot</part-wrap-ssr-shadow-cmp>
        </div>`,
        {
          fullDocument: true,
          serializeShadowRoot: 'scoped',
        },
      );

      await page.setContent(html || '');
      await page.waitForSelector('part-wrap-ssr-shadow-cmp[custom-hydrate-flag]');

      const bgColor = await page.evaluate(() => {
        const partEl = document
          .querySelector('part-wrap-ssr-shadow-cmp')
          ?.shadowRoot?.querySelector('part-ssr-shadow-cmp')
          ?.shadowRoot?.querySelector('[part="container"]');
        return partEl ? getComputedStyle(partEl).backgroundColor : null;
      });

      expect(bgColor).toBe('rgb(255, 192, 203)'); // pink
    });
  });
});
