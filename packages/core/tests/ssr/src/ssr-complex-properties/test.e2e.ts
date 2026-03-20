import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];
let serializeProperty: HydrateModule['serializeProperty'];
let resetHydrateDocData: HydrateModule['resetHydrateDocData'];

const getTemplate = (serialize: typeof serializeProperty) => `<complex-properties
  foo=${serialize({ bar: 123, loo: [1, 2, 3], qux: { quux: Symbol('quux') } })}
  baz=${serialize(new Map([['foo', { qux: Symbol('quux') }]]))}
  quux=${serialize(new Set(['foo']))}
  corge=${serialize(new Set([{ foo: { bar: 'foo' } }]))}
  grault=${serialize(Infinity)}
  waldo=${serialize(null)}
  kids-names=${serialize(['John', 'Jane', 'Jim'])}
/>`;

test.describe('ssr-complex-properties', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate/index.mjs');
    renderToString = mod.renderToString;
    serializeProperty = mod.serializeProperty;
    resetHydrateDocData = mod.resetHydrateDocData;
    resetHydrateDocData();
  });

  test('should render complex properties via renderToString', async () => {
    const template = getTemplate(serializeProperty);
    const { html } = await renderToString(template, {
      prettyHtml: true,
      fullDocument: false,
    });
    expect(html).toMatchSnapshot();
  });

  test('can render component and verify serialized properties hydrate correctly', async ({ page }) => {
    const template = getTemplate(serializeProperty);
    const { html } = await renderToString(template, {
      fullDocument: true,
    });

    await page.setContent(html);
    await page.waitForSelector('complex-properties[custom-hydrate-flag]');

    const text = await page.evaluate(() => {
      return document.querySelector('complex-properties')?.shadowRoot?.querySelector('ul')?.textContent;
    });
    expect(text).toContain('this.foo.bar: 123');
    expect(text).toContain('this.foo.loo: 1, 2, 3');
    expect(text).toContain('this.foo.qux: symbol');
    expect(text).toContain("this.baz.get('foo'): symbol");
    expect(text).toContain("this.quux.has('foo'): true");
    expect(text).toContain('this.grault: true');
    expect(text).toContain('this.waldo: true');
    expect(text).toContain('this.kidsNames: John, Jane, Jim');
  });

  test('can change a complex property and see it updated correctly', async ({ page }) => {
    const template = getTemplate(serializeProperty);
    const { html } = await renderToString(template, {
      fullDocument: true,
    });

    await page.setContent(html);
    await page.waitForSelector('complex-properties[custom-hydrate-flag]');

    // Update property via evaluate
    await page.evaluate(() => {
      const elm = document.querySelector('complex-properties') as any;
      elm.foo = { bar: '456', loo: [4, 5, 6], qux: { quux: Symbol('new quux') } };
      elm.kidsNames.push('Jill');
    });

    // Wait for re-render
    await page.waitForFunction(() => {
      const elm = document.querySelector('complex-properties');
      return elm?.shadowRoot?.querySelector('ul')?.textContent?.includes('456');
    });

    const text = await page.evaluate(() => {
      return document.querySelector('complex-properties')?.shadowRoot?.querySelector('ul')?.textContent;
    });
    expect(text).toContain('this.foo.bar: 456');
    expect(text).toContain('this.foo.loo: 4, 5, 6');
    expect(text).toContain('this.kidsNames: John, Jane, Jim, Jill');
  });
});
