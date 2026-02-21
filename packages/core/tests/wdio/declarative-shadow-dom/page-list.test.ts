// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('renderToString', () => {
  before(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('/hydrate/index.mjs');
    renderToString = mod.renderToString;
  });

  beforeEach(async () => {
    const { html } = await renderToString(`<page-list last-page="5" current-page="1"></page-list>`, {
      serializeShadowRoot: true,
      prettyHtml: true,
      fullDocument: false,
    });
    const stage = document.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    document.body.appendChild(stage);
  });

  afterEach(() => {
    document.querySelector('#stage')?.remove();
  });

  it('can hydrate a nested shadow component', async () => {
    expect(typeof customElements.get('page-list-item')).toBe('undefined');

    // @ts-expect-error resolved through WDIO
    const { defineCustomElements } = await import('/dist/loader/index.js');
    defineCustomElements().catch(console.error);

    // wait for Stencil to take over and reconcile
    await browser.waitUntil(async () => customElements.get('page-list-item'));
    expect(typeof customElements.get('page-list-item')).toBe('function');
    await expect($('page-list')).toHaveText('0\n1\n2\n3\n4');
  });
});
