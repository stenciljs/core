import { MockDocument } from '../document';
import { EMPTY_ELEMENTS, serializeNodeToHtml } from '../serialize-node';

describe('serializeNodeToHtml', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument();
  });

  it('remove most whitespace between elements, but not all of it when not in pretty print', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<div>\n\n\n   <span></span>\t\t  \n<b></b><code>  \t<b>var</b>    <span>88 </span>  </code>  </div>`;

    const html = serializeNodeToHtml(elm);
    expect(html).toBe(`<div> <span></span> <b></b><code>  \t<b>var</b>    <span>88 </span>  </code> </div>`);
  });

  it('remove most whitespace in text nodes, but not all of it when not in pretty print', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<div><span>var \n \t </span><b>\n\n\n\t     value\n\n\n\n\n    \t</b><span>    =</span><code>     88     </code>;</div>`;

    const html = serializeNodeToHtml(elm);
    expect(html).toBe(`<div><span>var </span><b> value </b><span> =</span><code>     88     </code>;</div>`);
  });

  it('do not add extra indentation when pretty print <pre><code>', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<section><article><pre><code><span>88</span></code></pre></article></section>`;

    const html = serializeNodeToHtml(elm, { prettyHtml: true });
    expect(html).toBe(`<section>\n  <article><pre><code><span>88</span></code></pre>\n  </article>\n</section>`);
  });

  it('do not pretty print <pre><code>', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<pre><code><span>88</span></code></pre>`;

    const html = serializeNodeToHtml(elm, { prettyHtml: true });
    expect(html).toBe(`<pre><code><span>88</span></code></pre>`);
  });

  it('do not pretty print <pre><code> w/ highlights and new', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<pre><code><span>install</span> cordova-plugin-purchase\nnpx cap update</code></pre>`;

    const html = serializeNodeToHtml(elm, { prettyHtml: true });
    expect(html).toBe(`<pre><code><span>install</span> cordova-plugin-purchase\nnpx cap update</code></pre>`);
  });

  it('do not pretty print <pre><code> w/ html comments', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<pre><code><span><!--a-->88</span>c<!--b--></code></pre>`;

    const html = serializeNodeToHtml(elm, { prettyHtml: true });
    expect(html).toBe(`<pre><code><span><!--a-->88</span>c<!--b--></code></pre>`);
  });

  it('do not pretty print <script>', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `<script>value = '';</script>`;

    const html = serializeNodeToHtml(elm, { prettyHtml: true });
    expect(html).toBe(`<script>value = '';</script>`);
  });

  it('do not remove whitespace within <code>', () => {
    const elm = doc.createElement('div');

    elm.innerHTML = `
      <p>
        <code>
          <span>var</span>
          <b>value</b>
          <strong>=</strong>
          <em>88</em><i>;</i>
        </code>
      </p>
    `;

    const html = serializeNodeToHtml(elm);
    expect(html).toBe(`<p> <code>
          <span>var</span>
          <b>value</b>
          <strong>=</strong>
          <em>88</em><i>;</i>
        </code> </p>`);
  });

  it('pretty print with comments', () => {
    const elm = doc.createElement('div');
    elm.innerHTML = `
      <p>
        <!--comment1-->
        <!--comment2-->
        <span>Hello</span>
        <!--comment3-->
        <!--comment4-->
      </p>
    `;

    expect(elm).toEqualHtml(`
      <div>
        <p>
          <!--comment1-->
          <!--comment2-->
          <span>Hello</span>
          <!--comment3-->
          <!--comment4-->
        </p>
      </div>
    `);
  });

  it('shadow root to template', () => {
    const elm = doc.createElement('cmp-a');
    expect(elm.shadowRoot).toEqual(null);

    const shadowRoot = elm.attachShadow({ mode: 'open' });
    expect(shadowRoot.nodeType).toEqual(11);
    expect(elm.shadowRoot.nodeType).toEqual(11);

    expect(shadowRoot.host).toEqual(elm);

    const shadowTop = doc.createElement('article');
    shadowTop.innerHTML = 'shadow top';
    shadowRoot.appendChild(shadowTop);

    const slot = doc.createElement('slot');
    shadowRoot.appendChild(slot);

    const shadowBottom = doc.createElement('section');
    shadowBottom.innerHTML = 'shadow bottom';
    shadowRoot.appendChild(shadowBottom);

    elm.innerHTML = '<div>light dom</div>';

    expect(elm).toEqualHtml(`
      <cmp-a>
        <mock:shadow-root>
          <article>shadow top</article>
          <slot></slot>
          <section>shadow bottom</section>
        </mock:shadow-root>
        <div>light dom</div>
      </cmp-a>
    `);
  });

  it('style', () => {
    const input = `<style>     \n    text   \n\n</style>`;
    doc.body.innerHTML = input;

    const output = serializeNodeToHtml(doc.body);
    expect(output).toBe(`<style>text</style>`);
  });

  it('template', () => {
    const input = `<template>text</template>`;
    doc.body.innerHTML = input;

    const output = serializeNodeToHtml(doc.body);
    expect(output).toBe(`<template>text</template>`);
  });

  it('svg', () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>`;
    doc.body.innerHTML = input;

    const output = serializeNodeToHtml(doc.body);
    expect(input).toBe(output);
  });

  it('remove boolean attributes', () => {
    const input = `<input type="checkbox" checked="">`;
    doc.body.innerHTML = input;

    const output = serializeNodeToHtml(doc.body, { removeBooleanAttributeQuotes: true });
    expect(output).toBe(`<input type="checkbox" checked>`);
  });

  it('do not collapse boolean attributes', () => {
    const input = `<input type="checkbox" checked="">`;
    doc.body.innerHTML = input;

    const output = serializeNodeToHtml(doc.body);
    expect(input).toBe(output);
  });

  it('do not remove empty attrs', () => {
    const elm = doc.createElement('button');

    elm.setAttribute('class', '');
    elm.setAttribute('dir', '');
    elm.setAttribute('my-attr', '');
    elm.setAttribute('id', '');
    elm.setAttribute('data-custom', '');
    elm.setAttribute('lang', '');
    elm.setAttribute('name', '');
    elm.setAttribute('title', '');

    const html = serializeNodeToHtml(elm, { outerHtml: true, removeEmptyAttributes: false });
    expect(html).toBe(`<button class="" dir="" my-attr="" id="" data-custom="" lang="" name="" title=""></button>`);
  });

  it('remove empty attrs', () => {
    const elm = doc.createElement('button');

    elm.setAttribute('class', '');
    elm.setAttribute('dir', '');
    elm.setAttribute('my-attr', '');
    elm.setAttribute('id', '');
    elm.setAttribute('data-custom', '');
    elm.setAttribute('lang', '');
    elm.setAttribute('name', '');
    elm.setAttribute('title', '');

    const html = serializeNodeToHtml(elm, { outerHtml: true });
    expect(html).toBe(`<button my-attr="" data-custom></button>`);
  });

  it('set attributes, pretty', () => {
    const elm = doc.createElement('button');
    elm.setAttribute('type', 'submit');
    elm.setAttribute('id', 'btn');
    elm.textContent = `Text`;
    const html = serializeNodeToHtml(elm, { outerHtml: true, prettyHtml: true });
    expect(html).toBe(`<button id="btn" type="submit">
  Text
</button>`);
  });

  it('set attributes', () => {
    const elm = doc.createElement('button');
    elm.setAttribute('type', 'submit');
    elm.setAttribute('id', 'btn');
    elm.textContent = `Text`;
    const html = serializeNodeToHtml(elm, { outerHtml: true });
    expect(html).toBe(`<button type="submit" id="btn">Text</button>`);
  });

  it('do not escape scripts', () => {
    const elm = doc.createElement('script');
    elm.innerHTML = `if (true && false) { console.log('hi); }`;
    const html = serializeNodeToHtml(elm, { outerHtml: true });
    expect(html).toBe(`<script>if (true && false) { console.log('hi); }</script>`);
  });

  it('empty document', () => {
    const html = serializeNodeToHtml(doc);
    expect(html).toBe(`<!doctype html><html><head></head><body></body></html>`);
  });

  it('empty document, pretty', () => {
    const html = serializeNodeToHtml(doc, { prettyHtml: true });
    expect(html).toBe(`<!doctype html>
<html>
  <head></head>
  <body></body>
</html>`);
  });

  it('script innerHTML', () => {
    const input = `x<y && a>b`;
    const scriptElm = doc.createElement('script');
    scriptElm.innerHTML = input;
    expect(scriptElm.innerHTML).toBe(input);
  });

  it.each([...EMPTY_ELEMENTS])("does not add a closing tag for '%s'", (voidElm) => {
    if (voidElm === 'frame') {
      // 'frame' is a non-HTML5 compatible/deprecated element.
      // Stencil technically still supports it, but it doesn't get rendered as a child element, so let's just skip it
      return;
    }

    const elm = doc.createElement('div');

    elm.innerHTML = `<${voidElm}>`;

    const html = serializeNodeToHtml(elm, { prettyHtml: true });
    expect(html).toBe(`<${voidElm}>`);
  });
});
