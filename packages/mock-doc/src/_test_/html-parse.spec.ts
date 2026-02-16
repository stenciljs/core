import { NODE_TYPES } from '../constants';
import { createFragment } from '../document';
import { MockDocument } from '../document';
import { MockDOMMatrix, MockDOMPoint, MockSVGRect, MockSVGSVGElement, MockSVGTextContentElement } from '../element';
import { parseHtmlToDocument, parseHtmlToFragment } from '../parse-html';

describe('parseHtml', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument();
  });

  it('should create multiple node documentFragment', () => {
    const frag = createFragment('<div>1</div><div>2</div>');
    expect(frag.childNodes.length).toBe(2);
    expect(frag.childNodes[0].textContent).toBe('1');
    expect(frag.childNodes[1].textContent).toBe('2');
  });

  it('should create one node documentFragment', () => {
    const frag = createFragment('<div>1</div>');
    expect(frag.childNodes.length).toBe(1);
    expect(frag.childNodes[0].textContent).toBe('1');
  });

  it('should create empty documentFragment', () => {
    const frag = createFragment();
    expect(frag.childNodes.length).toBe(0);
    expect(frag.nodeType).toBe(NODE_TYPES.DOCUMENT_FRAGMENT_NODE);
  });

  it('body innerHTML/querySelector', () => {
    doc = new MockDocument();

    doc.body.innerHTML = '<cmp-a>text</cmp-a>';

    expect(doc.body.innerHTML).toBe(`<cmp-a>text</cmp-a>`);
    expect(doc.body.outerHTML).toBe(`<body><cmp-a>text</cmp-a></body>`);

    const article = doc.querySelector('cmp-a');
    expect(article.tagName).toBe('CMP-A');
  });

  it('svg', () => {
    doc = new MockDocument(`
      <div>
        <svg>
          <a>Hello</a>
          <feImage></feImage>
          <foreignObject>
            <a>Hello</a>
            <feImage></feImage>
          </foreignObject>
        <svg>
      </div>
    `);
    expect(doc.body?.firstElementChild?.tagName).toEqual('DIV');
    expect(doc.body?.firstElementChild?.firstElementChild?.tagName).toEqual('svg');
    expect(doc.body?.firstElementChild?.firstElementChild?.children?.[0]?.tagName).toEqual('a');
    expect(doc.body?.firstElementChild?.firstElementChild?.children?.[1]?.tagName).toEqual('feImage');
    expect(doc.body?.firstElementChild?.firstElementChild?.children?.[2]?.tagName).toEqual('foreignObject');
    expect(doc.body?.firstElementChild?.firstElementChild?.children?.[2].children?.[0]?.tagName).toEqual('A');
    expect(doc.body?.firstElementChild?.firstElementChild?.children?.[2]?.children?.[1]?.tagName).toEqual('FEIMAGE');
    expect(doc.body).toEqualHtml(`
    <div>
      <svg>
        <a>
          Hello
        </a>
        <feImage></feImage>
        <foreignObject>
          <a>
            Hello
          </a>
          <feimage></feimage>
        </foreignObject>
        <svg></svg>
      </svg>
    </div>
    `);
  });

  it('svg attributes', () => {
    doc = new MockDocument(`
      <svg viewBox="0 0 100 100"></svg>
    `);

    expect(doc.body?.firstElementChild?.attributes?.item(0)?.name).toEqual('viewBox');
  });

  it('svg matrix members', () => {
    doc = new MockDocument(`
      <svg viewBox="0 0 100 100">
        <svg>
          <rect x="0" y="0" width="10" height="10"></rect>
        </svg>
      </svg>
    `);
    const svgElem: MockSVGSVGElement = doc.body.firstElementChild?.firstElementChild as MockSVGSVGElement;
    expect(svgElem).toBeDefined();
    expect(svgElem.getBBox()).toEqual(new MockSVGRect());
    expect(svgElem.createSVGPoint()).toEqual(new MockDOMPoint());
    expect(svgElem.getScreenCTM()).toEqual(new MockDOMMatrix());
    expect(svgElem.getCTM()).toEqual(new MockDOMMatrix());
  });

  it('svg text members', () => {
    doc = new MockDocument(`
      <svg viewBox="0 0 100 100">
        <text x="10" y="10">
          Hello
          <tspan>world</tspan>
        </text>
      </svg>
    `);
    const text: MockSVGTextContentElement = doc.body.firstElementChild?.firstElementChild as MockSVGTextContentElement;
    expect(text).toBeDefined();
    expect(text.tagName).toEqual('text');

    const tspan: MockSVGTextContentElement = text.firstElementChild as MockSVGTextContentElement;
    expect(tspan).toBeDefined();
    expect(tspan.getComputedTextLength()).toEqual(0);
  });

  it('template', () => {
    doc = new MockDocument(`
      <template>text</template>
    `);

    expect(doc.head.innerHTML).toBe(`<template>text</template>`);

    const tmplElm: HTMLTemplateElement = doc.head.firstElementChild as any;

    expect(tmplElm.outerHTML).toBe(`<template>text</template>`);
    expect(tmplElm.content?.firstChild?.textContent).toBe(`text`);
    expect(tmplElm.childNodes).toHaveLength(0);
  });

  it('getElementsByTagName', () => {
    doc = new MockDocument(`
      <article>article</article>
      <section>section</section>
      <section>section</section>
    `);

    expect(doc.nodeType).toBe(NODE_TYPES.DOCUMENT_NODE);
    expect(doc.childElementCount).toBe(1);
    expect(doc.firstElementChild?.tagName).toBe('HTML');
    expect(doc.lastChild?.nodeName).toBe('HTML');
    expect(doc.children[0].nodeName).toBe('HTML');
    expect(doc.children[0].nodeType).toBe(NODE_TYPES.ELEMENT_NODE);

    const htmlElms = doc.getElementsByTagName('html');
    expect(htmlElms).toHaveLength(1);
    expect(htmlElms[0].tagName).toBe('HTML');

    const bodyElms = doc.getElementsByTagName('body');
    expect(bodyElms).toHaveLength(1);
    expect(bodyElms[0].tagName).toBe('BODY');

    const articleElms = doc.getElementsByTagName('article');
    expect(articleElms).toHaveLength(1);
    expect(articleElms[0].tagName).toBe('ARTICLE');

    const sectionElms = doc.getElementsByTagName('section');
    expect(sectionElms).toHaveLength(2);
    expect(sectionElms[0].tagName).toBe('SECTION');
    expect(sectionElms[1].tagName).toBe('SECTION');
  });

  it('getElementsByName', () => {
    doc = new MockDocument(`
      <form name="form-name">
        <input name="a">
        <input name="a">
      </form>
    `);

    const formElms = doc.getElementsByName('form-name');
    expect(formElms).toHaveLength(1);

    const inputElms = doc.getElementsByName('a');
    expect(inputElms).toHaveLength(2);
  });

  it('get text only outerHTML', () => {
    const elm = doc.createElement('div');
    const text = doc.createTextNode('text');
    elm.appendChild(text);
    expect(elm.outerHTML).toBe('<div>text</div>');
  });

  it('get text only innerHTML', () => {
    const elm = doc.createElement('div');
    const text = doc.createTextNode('text');
    elm.appendChild(text);
    expect(elm.innerHTML).toBe('text');
  });

  it('set innerHTML', () => {
    const elm = doc.createElement('div');
    elm.innerHTML = '<div>hello</div>';
    expect(elm.childNodes).toHaveLength(1);
    expect(elm.children).toHaveLength(1);
    expect(elm.firstElementChild.tagName).toBe('DIV');
    expect(elm.firstElementChild.innerHTML).toBe('hello');
    expect(elm.innerHTML).toBe('<div>hello</div>');
  });

  it('get empty innerHTML', () => {
    const elm = doc.createElement('div');
    expect(elm.innerHTML).toBe('');
  });

  it('comment', () => {
    const html = `
      a<!--comment-->b
    `;
    const elm = parseHtmlToFragment(html, doc);
    expect(elm.childNodes).toHaveLength(3);
    expect(elm.firstChild.nodeValue).toBe('a');
    expect(elm.firstChild.nextSibling.nodeName).toBe('#comment');
    expect(elm.firstChild.nextSibling.nodeType).toBe(8);
    expect(elm.firstChild.nextSibling.nodeValue).toBe('comment');
    expect(elm.firstChild.nextSibling.textContent).toBe('comment');
    expect(elm.firstChild.nextSibling.nextSibling.nodeValue).toBe('b');
    expect(elm.lastChild.nodeValue).toBe('b');
  });

  it('div > span', () => {
    const html = `
      <div><span></span></div>
    `;
    const elm = parseHtmlToFragment(html, doc);
    expect(elm.children).toHaveLength(1);
    expect(elm.firstElementChild.tagName).toBe('DIV');
    expect(elm.firstElementChild.firstElementChild.tagName).toBe('SPAN');
    expect(elm.firstElementChild.lastChild.nodeName).toBe('SPAN');
    expect(elm.firstElementChild.firstElementChild.parentElement.tagName).toBe('DIV');
  });

  it('div span', () => {
    const html = `
      <div></div>
      <span></span>
    `;
    const elm = parseHtmlToFragment(html, doc);
    expect(elm.children).toHaveLength(2);
    expect(elm.children[0].tagName).toBe('DIV');
    expect(elm.children[0].nextElementSibling.tagName).toBe('SPAN');
    expect(elm.children[1].tagName).toBe('SPAN');
    expect(elm.children[1].previousElementSibling.tagName).toBe('DIV');
  });

  it('article', () => {
    const html = `
      <article>text</article>
    `;
    const elm = parseHtmlToFragment(html, doc);
    expect(elm.children).toHaveLength(1);
    expect(elm.firstElementChild.tagName).toBe('ARTICLE');
    expect(elm.firstElementChild.firstChild.nodeName).toBe('#text');
    expect(elm.firstElementChild.firstChild.nodeValue).toBe('text');
  });

  it('element with < text', () => {
    const html = `
      <article>a < b</article>
    `;
    const elm = parseHtmlToFragment(html, doc);
    expect(elm.children).toHaveLength(1);
    expect(elm.firstElementChild.tagName).toBe('ARTICLE');
    expect(elm.firstElementChild.firstChild.nodeName).toBe('#text');
    expect(elm.firstElementChild.firstChild.nodeValue).toBe('a < b');
  });

  it('div', () => {
    const html = `
      <div class="doc">hello</div>
    `;
    const elm = parseHtmlToDocument(html, doc);
    expect(elm.children).toHaveLength(1);
    expect(elm.children[0].tagName).toBe('HTML');
    expect(elm.children[0].firstChild.nodeName).toBe('HEAD');
    expect(elm.children[0].firstChild.nextSibling.nodeName).toBe('BODY');
    expect(elm.children[0].firstChild.nextSibling.firstChild.nodeName).toBe('DIV');
    expect(elm.children[0].firstChild.nextSibling.firstChild.firstChild.nodeValue).toBe('hello');
  });

  it('should respect case in svg', () => {
    const elm = parseHtmlToFragment('<svg  viewbox="0 0 97 20"><symbol viewbox="0 0 97 20"></symbol></svg>');
    expect(elm.children.length).toBe(1);
    expect(elm.children[0].attributes.item(0).name).toBe('viewBox');
    expect(elm.children[0].children[0].attributes.item(0).name).toBe('viewBox');
  });

  it('should mock canvas api', () => {
    const elm = parseHtmlToFragment('<canvas id="canvas" width="300" height="300"></canvas>');
    const canvas = elm.children[0];
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
    expect(elm.children.length).toBe(1);
    expect(elm.children[0].nodeName).toBe('CANVAS');
    expect(ctx.getImageData(0, 0, 300, 300).data.length).toBe(300 * 300 * 4);
  });
});
