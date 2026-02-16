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
});
