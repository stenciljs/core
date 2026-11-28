/**
 * @vitest-environment stencil
 */
import { afterEach, describe, expect, it } from 'vitest';

import { hmrGlobalStyleLinks, hmrInlineStyles } from '../hmr/style';
import { getHmrHref, updateCssUrlValue } from '../hmr/utils';

describe('updateCssUrlValue', () => {
  const versionId = '1234';

  it('should update url w/ existing qs', () => {
    const fileName = 'img.png';
    const css = `background-image: url('img.png?what=ever&s-hmr=4321')`;

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe(`background-image: url('img.png?what=ever&s-hmr=1234')`);
  });

  it('should update url w/ single quotes', () => {
    const fileName = 'img.png';
    const css = `background: url('img.png')`;

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe(`background: url('img.png?s-hmr=1234')`);
  });

  it('should update url w/ double quotes', () => {
    const fileName = 'img.png';
    const css = 'background: url("img.png")';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: url("img.png?s-hmr=1234")');
  });

  it('should update url w/ no quotes', () => {
    const fileName = 'img.png';
    const css = 'background: url(img.png)';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: url(img.png?s-hmr=1234)');
  });

  it('should not update for different file', () => {
    const fileName = 'img.png';
    const css = 'background: url(hello.png)';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: url(hello.png)');
  });

  it('should not get url', () => {
    const fileName = 'img.png';
    const css = 'background: red';

    const newCss = updateCssUrlValue(versionId, fileName, css);
    expect(newCss).toBe('background: red');
  });
});

describe('getHmrHref', () => {
  const versionId = '1234';

  it('update existing qs', () => {
    const fileName = 'file-a.css';
    const oldHref = './file-a.css?s-hmr=4321&what=ever';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('./file-a.css?s-hmr=1234&what=ever');
  });

  it('add to existing qs', () => {
    const fileName = 'file-a.css';
    const oldHref = './file-a.css?what=ever';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('./file-a.css?what=ever&s-hmr=1234');
  });

  it('update no prefix . or / relative href', () => {
    const fileName = 'file-a.css';
    const oldHref = 'file-a.css';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('file-a.css?s-hmr=1234');
  });

  it('update exact href', () => {
    const fileName = 'file-a.css';
    const oldHref = '/build/file-a.css';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('/build/file-a.css?s-hmr=1234');
  });

  it('not matching file name', () => {
    const fileName = 'file-a.css';
    const oldHref = '/build/file-b.css';

    const newHref = getHmrHref(versionId, fileName, oldHref);

    expect(newHref).toBe('/build/file-b.css');
  });
});

describe('hmrInlineStyles', () => {
  const versionId = '1234';

  it('should update existing style element', () => {
    const styleElm = document.createElement('style');
    styleElm.setAttribute('sty-id', 'sc-test-component');
    styleElm.innerHTML = '.old { color: red; }';
    document.head.appendChild(styleElm);

    hmrInlineStyles(document.documentElement, versionId, [
      {
        styleId: 'sc-test-component',
        styleTag: 'test-component',
        styleText: '.new { color: blue; }',
      },
    ]);

    expect(styleElm.innerHTML).toBe('.new { color: blue; }');
    expect(styleElm.getAttribute('data-hmr')).toBe(versionId);

    styleElm.remove();
  });

  it('should remove style element when styleText is empty', () => {
    const styleElm = document.createElement('style');
    styleElm.setAttribute('sty-id', 'sc-test-component');
    styleElm.innerHTML = '.old { color: red; }';
    document.head.appendChild(styleElm);

    hmrInlineStyles(document.documentElement, versionId, [
      { styleId: 'sc-test-component', styleTag: 'test-component', styleText: '' },
    ]);

    expect(document.querySelector('[sty-id="sc-test-component"]')).toBeNull();
  });

  it('should create style element when CSS is added for the first time', () => {
    // Create a component element (scoped, no shadow root)
    const component = document.createElement('test-component');
    document.body.appendChild(component);

    // No existing style element for this component
    expect(document.querySelector('[sty-id="sc-test-component"]')).toBeNull();

    hmrInlineStyles(document.documentElement, versionId, [
      {
        styleId: 'sc-test-component',
        styleTag: 'test-component',
        styleText: '.new { color: blue; }',
      },
    ]);

    // Style element should be created in head
    const styleElm = document.querySelector('[sty-id="sc-test-component"]');
    expect(styleElm).not.toBeNull();
    expect(styleElm!.innerHTML).toBe('.new { color: blue; }');
    expect(styleElm!.getAttribute('data-hmr')).toBe(versionId);

    component.remove();
    styleElm!.remove();
  });

  it('should create style element in shadow root for shadow DOM components', () => {
    // Create a shadow DOM component
    const component = document.createElement('test-shadow-component');
    const shadowRoot = component.attachShadow({ mode: 'open' });
    document.body.appendChild(component);

    hmrInlineStyles(document.documentElement, versionId, [
      {
        styleId: 'sc-test-shadow-component',
        styleTag: 'test-shadow-component',
        styleText: ':host { display: block; }',
      },
    ]);

    // Style element should be created in shadow root
    const styleElm = shadowRoot.querySelector('[sty-id="sc-test-shadow-component"]');
    expect(styleElm).not.toBeNull();
    expect(styleElm!.innerHTML).toBe(':host { display: block; }');

    component.remove();
  });

  it('should update style in shadow root', () => {
    const component = document.createElement('test-shadow-component');
    const shadowRoot = component.attachShadow({ mode: 'open' });
    const styleElm = document.createElement('style');
    styleElm.setAttribute('sty-id', 'sc-test-shadow-component');
    styleElm.innerHTML = '.old { color: red; }';
    shadowRoot.appendChild(styleElm);
    document.body.appendChild(component);

    hmrInlineStyles(document.documentElement, versionId, [
      {
        styleId: 'sc-test-shadow-component',
        styleTag: 'test-shadow-component',
        styleText: ':host { display: block; }',
      },
    ]);

    expect(styleElm.innerHTML).toBe(':host { display: block; }');
    expect(styleElm.getAttribute('data-hmr')).toBe(versionId);

    component.remove();
  });
});

describe('hmrGlobalStyleLinks', () => {
  const versionId = '1234';

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('inserts a style element immediately after the matching link', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/build/app.css';
    document.head.appendChild(link);

    hmrGlobalStyleLinks(document, versionId, [
      { fileName: 'app.css', styleText: 'body { color: red; }' },
    ]);

    const styleElm = document.head.querySelector('style[data-hmr-global]');
    expect(styleElm).not.toBeNull();
    expect(styleElm!.getAttribute('data-hmr-global')).toBe('app.css');
    expect(styleElm!.innerHTML).toBe('body { color: red; }');
    expect(styleElm!.previousElementSibling).toBe(link);
    expect(link.disabled).toBe(true);
  });

  it('updates the existing patch in place on a later change, without duplicating it', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/build/app.css';
    document.head.appendChild(link);

    hmrGlobalStyleLinks(document, versionId, [
      { fileName: 'app.css', styleText: 'body { color: red; }' },
    ]);
    hmrGlobalStyleLinks(document, '5678', [
      { fileName: 'app.css', styleText: 'body { color: blue; }' },
    ]);

    const styleElms = document.head.querySelectorAll('style[data-hmr-global]');
    expect(styleElms.length).toBe(1);
    expect(styleElms[0].innerHTML).toBe('body { color: blue; }');
    expect(styleElms[0].getAttribute('data-hmr')).toBe('5678');
  });

  it('keeps each patch next to its own link, preserving cascade order across multiple targets', () => {
    const linkA = document.createElement('link');
    linkA.rel = 'stylesheet';
    linkA.href = '/build/a.css';
    const linkB = document.createElement('link');
    linkB.rel = 'stylesheet';
    linkB.href = '/build/b.css';
    document.head.append(linkA, linkB);

    hmrGlobalStyleLinks(document, versionId, [
      { fileName: 'a.css', styleText: '.a { color: red; }' },
      { fileName: 'b.css', styleText: '.b { color: blue; }' },
    ]);

    const nodes = Array.from(document.head.children);
    expect(nodes.map((n) => n.tagName)).toEqual(['LINK', 'STYLE', 'LINK', 'STYLE']);
    expect(nodes[1].getAttribute('data-hmr-global')).toBe('a.css');
    expect(nodes[3].getAttribute('data-hmr-global')).toBe('b.css');
    expect(linkA.disabled).toBe(true);
    expect(linkB.disabled).toBe(true);
  });

  it('falls back to appending in head when no matching link exists', () => {
    hmrGlobalStyleLinks(document, versionId, [
      { fileName: 'app.css', styleText: 'body { color: red; }' },
    ]);

    const styleElm = document.head.querySelector('style[data-hmr-global="app.css"]');
    expect(styleElm).not.toBeNull();
    expect(styleElm!.innerHTML).toBe('body { color: red; }');
  });
});
