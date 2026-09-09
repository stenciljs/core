import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];
let setTagTransformer: HydrateModule['setTagTransformer'];
let resetSsrDocData: HydrateModule['resetSsrDocData'];

test.describe('tag transformer', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../dist/ssr/index.js');
    renderToString = mod.renderToString;
    setTagTransformer = mod.setTagTransformer;
    resetSsrDocData = mod.resetSsrDocData;
    resetSsrDocData();
  });

  test('without a transformer, an unknown renamed tag is not rendered by stencil', async () => {
    // No transformer - stencil does not know 'your-car-detail' maps to 'another-car-detail'
    const { html } = await renderToString(
      `<your-car-detail car='{"year":2024,"make":"VW","model":"Vento"}'></your-car-detail>`,
      { serializeShadowRoot: true, fullDocument: false, clientSsrAnnotations: false },
    );
    // Component was not hydrated - no rendered <section> inside
    expect(html).not.toContain('<section>');
  });

  test('with a transformer, the renamed tag is hydrated by the mapped component', async () => {
    setTagTransformer((tag) => tag.replace('another-', 'your-'));

    const { html } = await renderToString(
      `<your-car-detail car='{"year":2024,"make":"VW","model":"Vento"}'></your-car-detail>`,
      { serializeShadowRoot: true, fullDocument: false, clientSsrAnnotations: false },
    );
    // another-car-detail renders a <section> with the car info - proves stencil ran the component
    expect(html).toContain('<section>');
    expect(html).toContain('2024 VW Vento');
  });

  test('the outer tag in the rendered output uses the transformed name', async () => {
    setTagTransformer((tag) => tag.replace('another-', 'your-'));

    const { html } = await renderToString(
      `<your-car-detail car='{"year":2024,"make":"VW","model":"Vento"}'></your-car-detail>`,
      { serializeShadowRoot: true, fullDocument: false, clientSsrAnnotations: false },
    );
    expect(html).toContain('<your-car-detail');
    expect(html).not.toContain('<another-car-detail');
  });
});
