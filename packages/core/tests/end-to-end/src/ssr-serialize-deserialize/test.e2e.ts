import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

test.describe('ssr-serialize-deserialize', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../../hydrate/index.mjs');
    renderToString = mod.renderToString;
  });

  test('serializes and deserializes on server and client', async ({ page }) => {
    const { html } = await renderToString(`<serialize-deserializer />`, {
      prettyHtml: true,
    });

    // server-side rendered html should have serialized attributes
    expect(html).toContain('array="[&quot;a&quot;,&quot;b&quot;,&quot;c&quot;]"');
    expect(html).toContain('get-set="{&quot;foo&quot;:&quot;bar&quot;}"');

    await page.setContent(html);
    await page.waitForSelector('serialize-deserializer[custom-hydrate-flag]');

    // client side hydrated and deserialized the attributes back into properties
    const arrayProp = await page.evaluate(() => {
      const root = document.querySelector('serialize-deserializer') as any;
      return root.array;
    });
    expect(arrayProp).toEqual(['a', 'b', 'c']);

    const getSetProp = await page.evaluate(() => {
      const root = document.querySelector('serialize-deserializer') as any;
      return root.getSet;
    });
    expect(getSetProp).toEqual({ foo: 'bar' });
  });
});
