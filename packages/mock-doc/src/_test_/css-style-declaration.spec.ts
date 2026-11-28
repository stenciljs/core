import { describe, it, expect, beforeEach } from '@stencil/vitest';

import { MockCSSStyleDeclaration } from '../css-style-declaration';
import { MockDocument } from '../document';
import { MockHTMLElement } from '../node';

describe('css-style-declaration', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument();
  });

  it('should set attributes correctly', () => {
    const cssAttr = new MockCSSStyleDeclaration();
    cssAttr.cssText = 'color: red';

    expect(cssAttr.cssText).toBe('color: red;');
  });

  it('should handle attributes containing colons', () => {
    const cssAttr = new MockCSSStyleDeclaration();
    cssAttr.cssText = 'background-image: (https://ionic.io/img/ionic-io-og-img.png);';

    expect(cssAttr.cssText).toBe('background-image: (https://ionic.io/img/ionic-io-og-img.png);');
  });

  it('should set styles on html elements', () => {
    const element = new MockHTMLElement(doc, 'div');
    element.style = 'color: red; font-family: "My Custom Font"';

    expect(element.style.cssText).toEqual('color: red; font-family: "My Custom Font";');
    expect(element.style.cssText).toEqual(element.getAttribute('style'));
  });

  it('should not split declarations at a semicolon inside url()', () => {
    const cssAttr = new MockCSSStyleDeclaration();
    cssAttr.cssText = 'background: url(data:image/gif;base64,R0lGOD==) no-repeat; color: red';

    expect(cssAttr.getPropertyValue('background')).toBe(
      'url(data:image/gif;base64,R0lGOD==) no-repeat',
    );
    expect(cssAttr.getPropertyValue('color')).toBe('red');
    expect(cssAttr.cssText).toBe(
      'background: url(data:image/gif;base64,R0lGOD==) no-repeat; color: red;',
    );
  });

  it('should not split declarations at a semicolon inside quotes', () => {
    const cssAttr = new MockCSSStyleDeclaration();
    cssAttr.cssText = `background-image: url('data:image/png;base64,iVBORw0KGgo='); content: "a;b"; color: red`;

    expect(cssAttr.getPropertyValue('background-image')).toBe(
      `url('data:image/png;base64,iVBORw0KGgo=')`,
    );
    expect(cssAttr.getPropertyValue('content')).toBe('"a;b"');
    expect(cssAttr.getPropertyValue('color')).toBe('red');
  });

  it('should keep a semicolon after an escaped quote inside a string', () => {
    const cssAttr = new MockCSSStyleDeclaration();
    cssAttr.cssText = 'content: "a\\"; b"; color: red';

    expect(cssAttr.getPropertyValue('content')).toBe('"a\\"; b"');
    expect(cssAttr.getPropertyValue('color')).toBe('red');
  });

  it('should preserve data-URI styles when setting the style attribute', () => {
    const el = doc.createElement('div');
    el.setAttribute(
      'style',
      `background-image: url('data:image/png;base64,iVBORw0KGgo='); color: red`,
    );

    expect(el.getAttribute('style')).toBe(
      `background-image: url('data:image/png;base64,iVBORw0KGgo='); color: red;`,
    );
    expect(el.style.backgroundImage).toBe(`url('data:image/png;base64,iVBORw0KGgo=')`);
  });

  it('should round-trip data-URI styles through the HTML parser', () => {
    const el = doc.createElement('div');
    el.style.setProperty('background-image', 'url(data:image/png;base64,iVBORw0KGgo=)');
    el.style.setProperty('color', 'blue');

    const reparsed = new MockDocument(el.outerHTML);
    expect(reparsed.body.innerHTML).toBe(
      '<div style="background-image: url(data:image/png;base64,iVBORw0KGgo=); color: blue;"></div>',
    );
  });
});
