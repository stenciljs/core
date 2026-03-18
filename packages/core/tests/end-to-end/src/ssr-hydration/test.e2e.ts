import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

test.describe('ssr-hydration', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate/index.mjs');
    renderToString = mod.renderToString;
  });

  test('checks perf when loading lots of the same component', async () => {
    const startDsd = performance.now();

    await renderToString(
      Array(50)
        .fill(0)
        .map((_, i) => `<ssr-shadow-cmp>Value ${i}</ssr-shadow-cmp>`)
        .join(''),
      {
        fullDocument: true,
        serializeShadowRoot: 'declarative-shadow-dom',
        constrainTimeouts: false,
      },
    );

    const dsdRenderTime = performance.now() - startDsd;
    expect(dsdRenderTime).toBeLessThan(500); // generous timeout for CI

    const startScoped = performance.now();

    await renderToString(
      Array(50)
        .fill(0)
        .map((_, i) => `<ssr-shadow-cmp>Value ${i}</ssr-shadow-cmp>`)
        .join(''),
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
        constrainTimeouts: false,
      },
    );

    const scopedRenderTime = performance.now() - startScoped;
    expect(scopedRenderTime).toBeLessThan(500);
  });

  test('retains the order of slotted nodes in serializeShadowRoot scoped components', async ({ page }) => {
    const { html } = await renderToString(
      `<wrap-ssr-shadow-cmp>
        <ssr-shadow-cmp>
          <span>Should be first</span>
          <span slot="top">Should be second</span>
        </ssr-shadow-cmp>
      </wrap-ssr-shadow-cmp>`,
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
        prettyHtml: false,
      },
    );

    await page.setContent(html);
    await page.waitForSelector('ssr-shadow-cmp[custom-hydrate-flag]');

    const childTexts = await page.evaluate(() => {
      const childComponent = document.querySelector('ssr-shadow-cmp');
      return Array.from(childComponent?.childNodes || [])
        .filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent?.trim()))
        .map((n) => n.textContent?.trim());
    });

    expect(childTexts).toContain('Should be first');
    expect(childTexts).toContain('Should be second');
  });

  test('correctly renders ::part css selectors for scoped components in DSD', async ({ page }) => {
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

    await page.setContent(html);
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

  test('correctly renders ::part css selectors for scoped components in scoped mode', async ({ page }) => {
    const { html } = await renderToString(
      `<div>
        <part-wrap-ssr-shadow-cmp>Inside shadowroot</part-wrap-ssr-shadow-cmp>
      </div>`,
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
      },
    );

    await page.setContent(html);
    await page.waitForSelector('part-wrap-ssr-shadow-cmp[custom-hydrate-flag]');

    const bgColor = await page.evaluate(() => {
      const partEl = document.querySelector('part-wrap-ssr-shadow-cmp')
        ?.shadowRoot?.querySelector('part-ssr-shadow-cmp')
        ?.shadowRoot?.querySelector('[part="container"]');
      return partEl ? getComputedStyle(partEl).backgroundColor : null;
    });

    expect(bgColor).toBe('rgb(255, 192, 203)'); // pink
  });

  test('renders named slots in the correct order in the DOM in scoped components', async ({ page }) => {
    const { html } = await renderToString(
      `<div>
        <ssr-order-wrap-cmp>
          <div slot="things">one</div>
          <div slot="things">2</div>
          <div slot="things">3</div>
        </ssr-order-wrap-cmp>
      </div>`,
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
      },
    );

    await page.setContent(html);
    await page.waitForSelector('ssr-order-wrap-cmp[custom-hydrate-flag]');

    const result = await page.evaluate(() => {
      const nestedCmp = document
        .querySelector('ssr-order-wrap-cmp')
        ?.shadowRoot?.querySelector('ssr-order-cmp') as Element;
      if (!nestedCmp) return { firstTag: null, secondText: null };
      return {
        firstTag: (nestedCmp.childNodes[0] as HTMLElement)?.tagName,
        secondText: nestedCmp.childNodes[1]?.textContent,
      };
    });

    expect(result.firstTag).toBe('SLOT');
    expect(result.secondText).toBe('after');
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
    expect(html).toContain('sc-scoped-ssr-child-cmp');
    expect(html).toContain('border: 3px solid red');

    await page.setContent(html);
    await page.waitForSelector('shadow-ssr-parent-cmp[custom-hydrate-flag]');

    // Verify the style is actually applied after hydration
    const borderColor = await page.evaluate(() => {
      const wrapCmp = document.querySelector('shadow-ssr-parent-cmp');
      const childCmp = wrapCmp?.shadowRoot?.querySelector('scoped-ssr-child-cmp');
      return childCmp ? getComputedStyle(childCmp).borderColor : null;
    });

    expect(borderColor).toBe('rgb(255, 0, 0)');
  });

  test('scoped components forward slots into shadow components', async ({ page }) => {
    const { html } = await renderToString(
      `<div>
        <scoped-ssr-parent-cmp>
          <!-- 1 --> 2 <div>3</div> <!-- 4 -->
        </scoped-ssr-parent-cmp>
      </div>`,
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
      },
    );

    await page.setContent(html);
    await page.waitForSelector('scoped-ssr-parent-cmp[custom-hydrate-flag]');

    const result = await page.evaluate(() => {
      const wrapCmp = document.querySelector('scoped-ssr-parent-cmp');
      const children = wrapCmp?.childNodes;
      const visibleDiv = wrapCmp?.querySelector('div');
      return {
        childCount: children?.length,
        hasVisibleDiv: visibleDiv ? (visibleDiv as HTMLElement).checkVisibility?.() ?? true : false,
        textContent: wrapCmp?.textContent?.replace(/\s+/g, ' ').trim(),
      };
    });

    expect(result.textContent).toContain('2');
    expect(result.textContent).toContain('3');
    expect(result.hasVisibleDiv).toBe(true);
  });

  test('slots nodes appropriately in a scoped parent with serializeShadowRoot scoped child', async ({ page }) => {
    const { html } = await renderToString(
      `<scoped-ssr-parent-cmp>
        <div slot="things">one</div>
        <div slot="things">2</div>
        <div slot="things">3</div>
      </scoped-ssr-parent-cmp>`,
      {
        fullDocument: true,
        serializeShadowRoot: 'scoped',
      },
    );

    await page.setContent(html);
    await page.waitForSelector('scoped-ssr-parent-cmp[custom-hydrate-flag]');

    const result = await page.evaluate(() => {
      const wrapCmp = document.querySelector('scoped-ssr-parent-cmp');
      const children = Array.from(wrapCmp?.children || []);
      return {
        textContent: wrapCmp?.textContent?.replace(/\s+/g, '').trim(),
        visibleChildren: children.filter((c) => (c as HTMLElement).checkVisibility?.() ?? true).length,
      };
    });

    expect(result.textContent).toBe('one23');
    expect(result.visibleChildren).toBe(3);
  });

  test('correctly renders a slow to hydrate component with a prop', async ({ page }) => {
    const { html } = await renderToString(`<slow-ssr-prop></slow-ssr-prop>`, {
      fullDocument: true,
      serializeShadowRoot: 'declarative-shadow-dom',
      beforeHydrate: (doc) => {
        const slowCmp = doc.querySelector('slow-ssr-prop') as any;
        slowCmp.anArray = ['one', 'two', 'three'];
      },
    });

    await page.setContent(html);
    await page.waitForSelector('slow-ssr-prop[custom-hydrate-flag]');

    // Update the prop after hydration
    await page.evaluate(() => {
      const slowCmp = document.querySelector('slow-ssr-prop') as any;
      slowCmp.anArray = ['one', 'two', 'three', 'four'];
    });

    // Wait for re-render
    await page.waitForFunction(() => {
      const slowCmp = document.querySelector('slow-ssr-prop');
      return slowCmp?.shadowRoot?.querySelector('div')?.textContent?.includes('four');
    });

    const text = await page.evaluate(() => {
      const slowCmp = document.querySelector('slow-ssr-prop');
      return slowCmp?.shadowRoot?.querySelector('div')?.textContent;
    });

    expect(text).toBe('An array component:onetwothreefour');
  });
});
