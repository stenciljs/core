// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../../hydrate');
let renderToString: HydrateModule['renderToString'];

describe('custom svg element', function () {
  let originalConsoleError: typeof console.error;
  before(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('/hydrate/index.mjs');
    renderToString = mod.renderToString;
    originalConsoleError = console.error;
  });

  after(() => {
    console.error = originalConsoleError;
  });

  it('should render without errors', async () => {
    const errorLogs: string[] = [];
    console.error = (message) => errorLogs.push(message);

    const { html } = await renderToString(`<custom-svg-element />`, { prettyHtml: true });
    const stage = document.createElement('div');
    stage.setAttribute('id', 'stage');
    stage.setHTMLUnsafe(html);
    document.body.appendChild(stage);

    await expect($('custom-svg-element')).toHaveText('');

    expect(errorLogs.length).toEqual(0);
  });
});
