import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
// @ts-ignore may not be existing when project hasn't been built
type SsrPropModule = typeof import('../dist/ssr/ssr-prop.js');
let renderToString: HydrateModule['renderToString'];
let ssrProp: SsrPropModule['ssrProp'];

const registry = () => (globalThis as any)[Symbol.for('stencil.ssrProps')] as Map<string, unknown>;
const warnings = (diagnostics: { level: string; messageText: string }[]) =>
  diagnostics.filter((d) => d.level === 'warn').map((d) => d.messageText);

test.beforeEach(async () => {
  // @ts-ignore may not be existing when project hasn't been built
  renderToString = (await import('../dist/ssr/index.js')).renderToString;
  // @ts-ignore may not be existing when project hasn't been built
  ssrProp = (await import('../dist/ssr/ssr-prop.js')).ssrProp;
});

test.describe('ssrProp()', () => {
  test('hands the server render the value, under the prop name or its dash-case', async () => {
    for (const extraAttr of ['extraItems', 'extra-items']) {
      const { html } = await renderToString(
        `<ssr-prop-cmp items="${ssrProp(['a', 'b <c> & "d"'])}" ${extraAttr}="${ssrProp(['e'])}"></ssr-prop-cmp>`,
        { fullDocument: false },
      );
      expect(html).toContain('-->a</li>');
      expect(html).toContain('b &lt;c&gt; &amp; "d"</li>');
      expect(html).toContain('-->e</li>');
      expect(html).not.toContain('__stencil_ssr');
    }
  });

  test('hands over any value, unserialized', async () => {
    const scores = new Map([
      ['ada', 3],
      ['grace', 5],
    ]);
    const { html } = await renderToString(
      `<ssr-prop-map-cmp scores="${ssrProp(scores)}"></ssr-prop-map-cmp>`,
      { fullDocument: false },
    );
    expect(html).toContain('ada: 3');
    expect(html).toContain('grace: 5');
  });

  test('takes references out of the registry once used', async () => {
    const ref = ssrProp(['once']) as unknown as string;
    const id = ref.slice(ref.indexOf(':') + 1);
    expect(registry().has(id)).toBe(true);
    await renderToString(`<ssr-prop-cmp items="${ref}"></ssr-prop-cmp>`, { fullDocument: false });
    expect(registry().has(id)).toBe(false);
  });

  test('a reference with nothing behind it leaves the prop unset, with a warning', async () => {
    const { html, diagnostics } = await renderToString(
      '<ssr-prop-cmp items="__stencil_ssr_ref:nothing-here"></ssr-prop-cmp>',
      { fullDocument: false },
    );
    expect(html).not.toContain('__stencil_ssr');
    expect(html).not.toContain('<li');
    expect(warnings(diagnostics)).toEqual([
      expect.stringContaining(`<ssr-prop-cmp>'s "items" was passed with ssrProp()`),
    ]);
  });

  test('returns the value itself in the browser', async ({ page }) => {
    const source = readFileSync(new URL('../dist/ssr/ssr-prop.js', import.meta.url), 'utf8');
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({
      type: 'module',
      content: source.replace('export function ssrProp', 'window.ssrProp = function ssrProp'),
    });
    await page.waitForFunction(() => typeof (window as any).ssrProp === 'function');
    expect(
      await page.evaluate(() => {
        const input = new Map([['x', 1]]);
        return (window as any).ssrProp(input) === input;
      }),
    ).toBe(true);
  });
});

test.describe('getting a complex prop to the browser', () => {
  const setItems = (doc: Document) => {
    (doc.querySelector('ssr-prop-serialized-cmp') as any).items = ['x', 'y'];
  };

  test('a value set before the component upgrades goes through @PropSerialize', async () => {
    const { html } = await renderToString('<ssr-prop-serialized-cmp></ssr-prop-serialized-cmp>', {
      fullDocument: false,
      beforeSsr: setItems,
    });
    expect(html).toContain('items="[&quot;x&quot;,&quot;y&quot;]"');
  });

  test('so does an ssrProp() value', async () => {
    const { html } = await renderToString(
      `<ssr-prop-serialized-cmp items="${ssrProp(['t'])}"></ssr-prop-serialized-cmp>`,
      { fullDocument: false },
    );
    expect(html).toContain('items="[&quot;t&quot;]"');
    expect(html).toContain('-->t</li>');
  });

  test('and the browser renders with it from the start', async ({ page }) => {
    const { html } = await renderToString('<ssr-prop-serialized-cmp></ssr-prop-serialized-cmp>', {
      beforeSsr: setItems,
    });
    await page.setContent(html || '');
    await page.waitForFunction(() => (window as any).__firstItems);
    expect(await page.evaluate(() => (window as any).__firstItems)).toEqual(['x', 'y']);
  });

  test('with its own format, it can be any value', async ({ page }) => {
    const scores = new Map([
      ['ada', 3],
      ['grace', 5],
    ]);
    const { html } = await renderToString(
      `<ssr-prop-map-cmp scores="${ssrProp(scores)}"></ssr-prop-map-cmp>`,
    );
    expect(html).toContain('scores="[[&quot;ada&quot;,3],[&quot;grace&quot;,5]]"');
    await page.setContent(html || '');
    await page.waitForFunction(() => (window as any).__firstScores);
    expect(await page.evaluate(() => (window as any).__firstScores)).toEqual([
      ['ada', 3],
      ['grace', 5],
    ]);
  });

  test('without @PropSerialize, the render warns that the browser will not get it', async () => {
    const { diagnostics } = await renderToString(
      '<ssr-prop-cmp label="primitive"></ssr-prop-cmp>',
      {
        fullDocument: false,
        beforeSsr: (doc) => {
          (doc.querySelector('ssr-prop-cmp') as any).items = ['x'];
        },
      },
    );
    expect(warnings(diagnostics)).toEqual([
      expect.stringContaining(`<ssr-prop-cmp>'s "items" prop was given an object on the server`),
    ]);
  });

  test("with @PropSerialize, or for defaults and attributes, it doesn't", async () => {
    const serialized = await renderToString('<ssr-prop-serialized-cmp></ssr-prop-serialized-cmp>', {
      fullDocument: false,
      beforeSsr: setItems,
    });
    const defaults = await renderToString(
      '<ssr-prop-cmp label="from an attribute"></ssr-prop-cmp>',
      {
        fullDocument: false,
      },
    );
    expect(warnings(serialized.diagnostics)).toEqual([]);
    expect(warnings(defaults.diagnostics)).toEqual([]);
  });
});

test.describe("@Prop({ serialize: 'json' })", () => {
  const setItems = (doc: Document) => {
    (doc.querySelector('ssr-prop-json-cmp') as any).items = ['x', 'y <z>'];
  };

  test('writes the value to its attribute on the server, with no warning', async () => {
    const { html, diagnostics } = await renderToString('<ssr-prop-json-cmp></ssr-prop-json-cmp>', {
      fullDocument: false,
      beforeSsr: setItems,
    });
    expect(html).toContain('items="[&quot;x&quot;,&quot;y <z>&quot;]"');
    expect(html).toContain('-->x</li>');
    expect(warnings(diagnostics)).toEqual([]);
  });

  test('the browser renders with it from the start', async ({ page }) => {
    const { html } = await renderToString('<ssr-prop-json-cmp></ssr-prop-json-cmp>', {
      beforeSsr: setItems,
    });
    await page.setContent(html || '');
    await page.waitForFunction(() => (window as any).__jsonFirstItems);
    expect(await page.evaluate(() => (window as any).__jsonFirstItems)).toEqual(['x', 'y <z>']);
  });

  test('invalid JSON leaves the prop as it is, on the server and in the browser', async ({
    page,
  }) => {
    const { html } = await renderToString(
      '<ssr-prop-json-cmp items="not json"></ssr-prop-json-cmp>',
      {
        fullDocument: false,
      },
    );
    expect(html).toContain('-->default</li>');

    await page.setContent('<ssr-prop-json-cmp items="not json"></ssr-prop-json-cmp>');
    await page.waitForFunction(() => (window as any).__jsonFirstItems);
    expect(await page.evaluate(() => (window as any).__jsonFirstItems)).toEqual(['default']);
  });
});
