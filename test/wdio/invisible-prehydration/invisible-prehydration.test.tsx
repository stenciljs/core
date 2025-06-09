/**
 * Note: this file is meant to be run in the browser, not in Node.js. WebdriverIO
 * injects some basic polyfills for Node.js to make the following possible.
 */
import path from 'node:path';

async function setupTest(htmlFile: string): Promise<Document> {
  if (document.querySelector('iframe')) {
    document.body.removeChild(document.querySelector('iframe'));
  }

  const htmlFilePath = path.resolve(
    path.dirname(globalThis.__wdioSpec__),
    '..',
    'www-invisible-prehydration',
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
  return iframe.contentDocument;
}

describe('invisible-prehydration-false', () => {
  let iframe: Document;

  beforeEach(async () => {
    iframe = await setupTest('index.html');

    // Tried using the `browser.waitUntil()` pattern here, but it was flakey and throwing errors on occasion
    await browser.pause(100);
  });

  it('the style element will not be placed in the head', async () => {
    expect(iframe.body.querySelector('prehydrated-styles').innerHTML).toEqual('<div>prehydrated-styles</div>');
    expect(iframe.head.querySelectorAll('style[data-styles]').length).toBe(0);
  });
});
