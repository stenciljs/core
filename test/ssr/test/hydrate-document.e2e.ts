import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let hydrateDocument: HydrateModule['hydrateDocument'];
let createWindowFromHtml: HydrateModule['createWindowFromHtml'];
let resetHydrateDocData: HydrateModule['resetHydrateDocData'];

test.describe('hydrateDocument', () => {
  test.beforeEach(async () => {
    // @ts-ignore may not be existing when project hasn't been built
    const mod = await import('../dist/ssr/index.js');
    hydrateDocument = mod.hydrateDocument;
    createWindowFromHtml = mod.createWindowFromHtml;
    resetHydrateDocData = mod.resetHydrateDocData;
    resetHydrateDocData();
  });

  test('resolves to a Promise<HydrateResults>', async () => {
    const renderedDocument = hydrateDocument('<div>Hello World</div>');
    expect(typeof renderedDocument.then).toBe('function');
    // this is a type assertion to verify that the promise resolves to a HydrateResults object
    renderedDocument.then((result) => result.html);
  });

  test('can hydrate components with open shadow dom by default', async () => {
    const template = `<another-car-detail></another-car-detail>`;
    const fullHTML = `<html><head></head><body>${template}</body></html>`;
    const win = createWindowFromHtml(fullHTML, Math.random().toString());
    const document = win.document;
    await hydrateDocument(document);
    const html = document.documentElement.outerHTML;

    expect(html).toContain('shadowrootmode="open"');
  });

  test('can hydrate components with scoped shadow dom', async () => {
    const template = `<another-car-detail></another-car-detail>`;
    const fullHTML = `<html><head></head><body>${template}</body></html>`;
    const win = createWindowFromHtml(fullHTML, Math.random().toString());
    const document = win.document;
    await hydrateDocument(document, {
      serializeShadowRoot: 'scoped',
    });
    const html = document.documentElement.outerHTML;

    expect(html).not.toContain('shadowrootmode="open"');
    expect(html).toContain('sc-');
  });
});
