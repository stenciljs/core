import { browser } from '@wdio/globals';

import { renderToString } from '../hydrate/index.mjs';

const LIGHT = 'ssr-style-light-cmp';
const SCOPED = 'ssr-style-scoped-cmp';
const SHADOW = 'ssr-style-shadow-cmp';
const TAGS = [LIGHT, SCOPED, SHADOW];

// a global stylesheet after the component styles must keep winning against them
const GLOBAL_STYLE = `<style>${LIGHT} { color: rgb(0, 0, 255); }</style>`;

const renderPage = async () => {
  const { html } = await renderToString(TAGS.map((tag) => `<${tag}></${tag}><${tag}></${tag}>`).join(''), {
    fullDocument: true,
    serializeShadowRoot: 'scoped',
    constrainTimeouts: false,
    prettyHTML: false,
  });
  return new DOMParser().parseFromString(html, 'text/html');
};

const sheetsWith = (doc: Document, marker: string) => ({
  head: Array.from(doc.head.querySelectorAll('style')).filter((style) => style.textContent.includes(marker)),
  adopted: doc.adoptedStyleSheets.filter((sheet) =>
    Array.from(sheet.cssRules).some((rule) => rule.cssText.includes(marker)),
  ),
});

const expectHydratedStyles = async (doc: Document) => {
  await browser.waitUntil(async () => !!doc.querySelector(SHADOW)?.shadowRoot?.querySelector('p'));
  await browser.waitUntil(async () => TAGS.every((tag) => doc.querySelector(tag)?.classList.contains('hydrated')));

  // non-shadow components reuse the server-rendered sheet in the head
  for (const [tag, marker] of [
    [LIGHT, '--ssr-style-light'],
    [SCOPED, '--ssr-style-scoped'],
  ]) {
    const sheets = sheetsWith(doc, marker);
    expect(sheets.head.map((style) => style.getAttribute('sty-id'))).toEqual([`sc-${tag}`]);
    expect(sheets.adopted).toHaveLength(0);
  }
  expect(getComputedStyle(doc.querySelector(LIGHT)).color).toBe('rgb(0, 0, 255)');

  // shadow components get their server-rendered 'scoped' styles converted back for the shadow root
  const shadowRoot = doc.querySelector(SHADOW).shadowRoot;
  expect(getComputedStyle(shadowRoot.querySelector('p')).fontWeight).toBe('700');
  expect(sheetsWith(doc, '--ssr-style-shadow').adopted).toHaveLength(0);
};

describe('SSR style hydration', () => {
  it('reuses server-rendered styles with the lazy loader', async () => {
    const page = await renderPage();
    page.head.querySelectorAll('style').forEach((style) => document.head.append(document.importNode(style, true)));
    document.head.insertAdjacentHTML('beforeend', GLOBAL_STYLE);
    const stage = document.createElement('div');
    stage.innerHTML = page.body.innerHTML;
    document.body.append(stage);

    // @ts-expect-error resolved through WDIO
    const { defineCustomElements } = await import('/dist/loader/index.js');
    defineCustomElements().catch(console.error);

    await expectHydratedStyles(document);
  });

  it('reuses server-rendered styles with dist-custom-elements', async () => {
    const page = await renderPage();
    const defines = TAGS.map(
      (tag, i) => `import { defineCustomElement as define${i} } from '/test-components/${tag}.js'; define${i}();`,
    ).join('\n');
    const iframe = document.createElement('iframe');
    iframe.srcdoc = `<!doctype html><html><head>${page.head.innerHTML}${GLOBAL_STYLE}<script type="module">${defines}</script></head><body>${page.body.innerHTML}</body></html>`;
    const loaded = new Promise((resolve) => (iframe.onload = resolve));
    document.body.append(iframe);
    await loaded;

    await expectHydratedStyles(iframe.contentDocument);
  });
});
