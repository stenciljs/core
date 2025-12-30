// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('serialize-deserialize e2e', function () {
  before(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('/hydrate/index.mjs');
    renderToString = mod.renderToString;
  });

  it('serializes and deserializes on server and client', async () => {
    const { html } = await renderToString(`<serialize-deserializer />`, { prettyHtml: true, hydrateClientSide: true });

    // server-side rendered html should have serialized attributes
    expect(html).toContain('array="[&quot;a&quot;,&quot;b&quot;,&quot;c&quot;]"');
    expect(html).toContain('get-set="{&quot;foo&quot;:&quot;bar&quot;}"');

    const stage = document.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    document.body.appendChild(stage);
    const root = document.body.querySelector('serialize-deserializer');

    // client side hydrated and deserialized the attributes back into properties
    await expect(root.array).toEqual(['a', 'b', 'c']);
    await expect(root.getSet).toEqual({ foo: 'bar' });
  });
});
