import type * as d from '@stencil/core/declarations';
import { mockDocument } from '@stencil/core/testing';

import { removeUnusedStyles } from '../remove-unused-styles';

describe('removeUnusedStyles', () => {
  let results: d.HydrateResults;

  beforeEach(() => {
    results = {
      diagnostics: [],
    } as any;
  });

  it('should not remove used attr contains selectors', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            pre[class*="language-"] { font: used; }
          </style>
        </head>
        <body>
          <pre class="language-tsx">
            <code class="language-tsx">
              Used
            </code>
          </pre>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, 'pre[class*="language-"]');
  });

  it('should remove unused nested selectors', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            [dir="ltr"] h1+h2 { font: used; }
            [dir="ltr"] h1+h3 { font: unused; }
          </style>
        </head>
        <body>
          <div dir="ltr">
            <h1>Used</h1>
            <h2>Used</h2>
          </div>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, '[dir="ltr"] h1+h2');
    expectNoSelector(css, '[dir="ltr"] h1+h3');
  });

  it('should remove all unused nested selectors', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            div label { font: used; }
            div label#usedId { font: used; }
            div label#usedId.my-used { font: used; }
            div label#usedId.my-used[mph] { font: used; }
          </style>
        </head>
        <body>
          <div>
            <button id="usedId" class="my-used" mph="88">Unused</button>
          </div>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectNoSelector(css, 'label { font: used; }');
    expectNoSelector(css, 'div label { font: used; }');
    expectNoSelector(css, 'div label#usedId { font: used; }');
    expectNoSelector(css, 'div label#usedId.my-used { font: used; }');
    expectNoSelector(css, 'div label#usedId.my-used[mph] { font: used; }');
  });

  it('should keep used nested selectors', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            div { font: used; }
            label { font: used; }
            div label { font: used; }
            div label#usedId { font: used; }
            div label#usedId.my-used { font: used; }
            div label#usedId.my-used[mph] { font: used; }
          </style>
        </head>
        <body>
          <div>
            <label id="usedId" class="my-used" mph="88">Used</label>
          </div>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, 'div{font:used}');
    expectSelector(css, 'label{font:used}');
    expectSelector(css, 'div label{font:used}');
    expectSelector(css, 'div label#usedId{font:used}');
    expectSelector(css, 'div label#usedId.my-used{font:used}');
    expectSelector(css, 'div label#usedId.my-used[mph]{font:used}');
  });

  it('should remove unused id selector', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            label { font: used; }
            label#usedId { font: used; }
            label#unusedId { font: unused; }
            #another-UsedId { font: used; }
            #another-UnusedId { font: unused; }
          </style>
        </head>
        <body>
          <div>
            <label id="usedId">Used</label>
            <div id="another-UsedId">Used</div>
          </div>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, 'label{font:used}');
    expectSelector(css, 'label#usedId');
    expectSelector(css, '#another-UsedId');
    expectNoSelector(css, 'label#unusedId');
    expectNoSelector(css, '#another-UnusedId');
  });

  it('should remove unused attr selector', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            label { font: used; }
            label[mph="88"] { font: used; }
            label[unused="val"] { font: unused; }
          </style>
        </head>
        <body>
          <label mph="88">Used</label>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, 'label{font:used}');
    expectSelector(css, 'label[mph="88"]');
    expectNoSelector(css, 'label[unused="val"]');
  });

  it('should remove unused tag selector', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            div { font: unused }
            label { font: used }
          </style>
        </head>
        <body>
          <label class="div">Used</label>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, 'label');
    expectNoSelector(css, 'div');
  });

  it('should remove unused classname in multi-selector', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            .unused-class, .unused-class2 { font: unused }
            .used-class { font: used }
          </style>
        </head>
        <body>
          <div class="used-class"></div>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, '.used-class');
    expectNoSelector(css, '.unused-class');
    expectNoSelector(css, '.unused-class2');
  });

  it('should remove unused classname', () => {
    const doc = mockDocument(`
      <html>
        <head>
          <style data-styles>
            .used-class { font: used }
            .unused-class { font: unused }
          </style>
        </head>
        <body>
          <div class="used-class"></div>
        </body>
      </html>
    `);

    removeUnusedStyles(doc, results.diagnostics);

    expect(results.diagnostics).toHaveLength(0);

    // Assert that `querySelector()` will return a value, since we defined the `style` element above.
    const css = doc.querySelector('style')!.innerHTML;

    expectSelector(css, '.used-class');
    expectNoSelector(css, '.unused-class');
  });

  function expectSelector(css: string, selector: string) {
    selector = selector.replace(/ \{ /g, '{').replace(/ \} /g, '}').replace(/\: /g, ':').replace(/\; /g, ';');
    expect(css).toContain(selector);
  }

  function expectNoSelector(css: string, selector: string) {
    selector = selector.replace(/ \{ /g, '{').replace(/ \} /g, '}').replace(/\: /g, ':').replace(/\; /g, ';');
    expect(css).not.toContain(selector);
  }
});
