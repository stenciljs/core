/**
 * Note: this file is meant to be run in the browser, not in Node.js. WebdriverIO
 * injects some basic polyfills for Node.js to make the following possible.
 */
import path from 'node:path';

async function setupTest(htmlFile: string): Promise<HTMLElement> {
  if (document.querySelector('iframe')) {
    document.body.removeChild(document.querySelector('iframe'));
  }

  const htmlFilePath = path.resolve(
    path.dirname(globalThis.__wdioSpec__),
    '..',
    'www-prerender-script',
    htmlFile.slice(htmlFile.startsWith('/') ? 1 : 0),
  );
  const iframe = document.createElement('iframe');

  /**
   * Note: prefixes the absolute path to the html file with `/@fs` is a ViteJS (https://vitejs.dev/)
   * feature which allows to serve static content from files this way
   */
  iframe.src = `/@fs${htmlFilePath}`;
  iframe.width = '600px';
  iframe.height = '600px';
  document.body.appendChild(iframe);

  /**
   * wait for the iframe to load
   */
  await new Promise((resolve) => (iframe.onload = resolve));
  return iframe.contentDocument.body;
}

/**
 * This monkey-patches `window.console.error` in order to fail a test if that
 * function is called within a test.
 *
 * @returns a teardown function which ondoes the monkey-patch
 */
function patchConsoleError() {
  const orgConsoleError = window.console.error;

  window.console.error = function (...args: any[]) {
    orgConsoleError.apply(window, args);
    window.console.info('console.error', args);
    throw new Error('console.error was called, this is not allowed in a unit test run');
  };

  return () => {
    window.console.error = orgConsoleError;
  };
}

describe('prerender', () => {
  let iframe: HTMLElement;
  before(async () => {
    iframe = await setupTest('/prerender/index.html');
  });

  it('server componentWillLoad Order', async () => {
    const elm = await browser.waitUntil(() => iframe.querySelector<HTMLElement>('#server-componentWillLoad'));
    expect(elm.innerText).toMatchInlineSnapshot(`
      "CmpA server componentWillLoad
      CmpD - a1-child server componentWillLoad
      CmpD - a2-child server componentWillLoad
      CmpD - a3-child server componentWillLoad
      CmpD - a4-child server componentWillLoad
      CmpB server componentWillLoad
      CmpC server componentWillLoad
      CmpD - c-child server componentWillLoad"
    `);
  });

  it('server componentDidLoad Order', async () => {
    const elm = await browser.waitUntil(() => iframe.querySelector<HTMLElement>('#server-componentDidLoad'));
    expect(elm.innerText).toMatchInlineSnapshot(`
      "CmpD - a1-child server componentDidLoad
      CmpD - a2-child server componentDidLoad
      CmpD - a3-child server componentDidLoad
      CmpD - a4-child server componentDidLoad
      CmpD - c-child server componentDidLoad
      CmpC server componentDidLoad
      CmpB server componentDidLoad
      CmpA server componentDidLoad"
    `);
  });

  it('correct scoped styles applied after scripts kick in', async () => {
    const iframe = await setupTest('/prerender/index.html');
    await browser.waitUntil(() => iframe.querySelector('cmp-scoped-a.hydrated'));
    testScopedStyles(iframe);
  });

  it('no-script, correct scoped styles applied before scripts kick in', async () => {
    const iframe = await setupTest('/prerender/index-no-script.html');
    testScopedStyles(iframe);
  });

  it('root slots', async () => {
    const iframe = await setupTest('/prerender/index.html');

    const scoped = iframe.querySelector('cmp-client-scoped');
    const scopedStyle = getComputedStyle(scoped.querySelector('section'));
    expect(scopedStyle.color).toBe('rgb(255, 0, 0)');

    const shadow = iframe.querySelector('cmp-client-shadow');
    await browser.waitUntil(async () => shadow.shadowRoot.querySelector('article'));
    const article = shadow.shadowRoot.querySelector('article');

    const shadowStyle = getComputedStyle(article);
    await browser.waitUntil(async () => shadowStyle.color === 'rgb(0, 155, 0)');
    expect(shadowStyle.color).toBe('rgb(0, 155, 0)');

    const blueText = shadow.shadowRoot.querySelector('cmp-text-blue');
    const blueTextStyle = getComputedStyle(blueText.querySelector('text-blue'));
    await browser.waitUntil(async () => blueTextStyle.color === 'rgb(0, 0, 255)');
    expect(blueTextStyle.color).toBe('rgb(0, 0, 255)');

    const greenText = shadow.shadowRoot.querySelector('cmp-text-green');
    const greenTextStyle = getComputedStyle(greenText.querySelector('text-green'));
    expect(greenTextStyle.color).toBe('rgb(0, 255, 0)');
  });

  // this describe block is just here to let us run a cleanup function after
  // the test exits, whether or not it fails
  describe('should render an svg child', () => {
    const teardown = patchConsoleError();
    after(teardown);

    it('should render an svg child', async () => {
      const iframe = await setupTest('/prerender/index.html');
      const testSvg = iframe.querySelector('test-svg');
      expect(testSvg.className).toContain('hydrated');
    });
  });
});

function testScopedStyles(app: HTMLElement) {
  const cmpScopedA = app.querySelector('cmp-scoped-a');
  const scopedAStyles = window.getComputedStyle(cmpScopedA);
  expect(scopedAStyles.backgroundColor).toBe('rgb(0, 128, 0)');

  const cmpScopedADiv = cmpScopedA.querySelector('div');
  const scopedADivStyles = window.getComputedStyle(cmpScopedADiv);
  expect(scopedADivStyles.fontSize).toBe('14px');

  const cmpScopedAP = cmpScopedA.querySelector('p');
  const scopedAPStyles = window.getComputedStyle(cmpScopedAP);
  expect(scopedAPStyles.color).toBe('rgb(128, 0, 128)');

  const cmpScopedAScopedClass = cmpScopedA.querySelector('.scoped-class');
  const scopedAScopedClassStyles = window.getComputedStyle(cmpScopedAScopedClass);
  expect(scopedAScopedClassStyles.color).toBe('rgb(0, 0, 255)');

  const cmpScopedB = app.querySelector('cmp-scoped-b');
  const scopedBStyles = window.getComputedStyle(cmpScopedB);
  expect(scopedBStyles.backgroundColor).toBe('rgb(128, 128, 128)');

  const cmpScopedBDiv = cmpScopedB.querySelector('div');
  const scopedBDivStyles = window.getComputedStyle(cmpScopedBDiv);
  expect(scopedBDivStyles.fontSize).toBe('18px');

  const cmpScopedBP = cmpScopedB.querySelector('p');
  const scopedBPStyles = window.getComputedStyle(cmpScopedBP);
  expect(scopedBPStyles.color).toBe('rgb(0, 128, 0)');

  const cmpScopedBScopedClass = cmpScopedB.querySelector('.scoped-class');
  const scopedBScopedClassStyles = window.getComputedStyle(cmpScopedBScopedClass);
  expect(scopedBScopedClassStyles.color).toBe('rgb(255, 255, 0)');
}
