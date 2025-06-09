import { MockDocument } from '../document';
import { MockStyleElement } from '../element';

describe('css-style-sheet', () => {
  let doc: MockDocument;
  let style: MockStyleElement;

  beforeEach(() => {
    doc = new MockDocument();
    style = doc.createElement('style');
    doc.head.appendChild(style);
  });

  it('innerHTML', () => {
    style.innerHTML = 'body{color:red}';
    expect(style.childNodes).toHaveLength(1);
    expect(style.innerHTML).toBe('body{color:red}');
    style.sheet.insertRule('body{color:blue}');
    expect(style.childNodes).toHaveLength(1);
    expect(style.innerHTML).toBe('body{color:blue}\nbody{color:red}');
    style.innerHTML = 'body{color:green}';
    expect(style.childNodes).toHaveLength(1);
    expect(style.innerHTML).toBe('body{color:green}');
  });

  it('insertRule / deleteRule', () => {
    style.sheet.insertRule('body{color:red}');
    expect(style.sheet.cssRules).toHaveLength(1);

    style.sheet.insertRule('body{color:blue}');
    expect(style.sheet.cssRules).toHaveLength(2);
    expect(style.sheet.cssRules[0].cssText).toBe('body{color:blue}');
    expect(style.sheet.cssRules[1].cssText).toBe('body{color:red}');

    style.sheet.insertRule('body{color:green}', -1);
    expect(style.sheet.cssRules).toHaveLength(3);
    expect(style.sheet.cssRules[0].cssText).toBe('body{color:green}');
    expect(style.sheet.cssRules[1].cssText).toBe('body{color:blue}');
    expect(style.sheet.cssRules[2].cssText).toBe('body{color:red}');

    style.sheet.insertRule('body{color:yellow}', 88);
    expect(style.sheet.cssRules).toHaveLength(4);
    expect(style.sheet.cssRules[0].cssText).toBe('body{color:green}');
    expect(style.sheet.cssRules[1].cssText).toBe('body{color:blue}');
    expect(style.sheet.cssRules[2].cssText).toBe('body{color:red}');
    expect(style.sheet.cssRules[3].cssText).toBe('body{color:yellow}');

    style.sheet.deleteRule(0);
    expect(style.sheet.cssRules).toHaveLength(3);
    expect(style.sheet.cssRules[0].cssText).toBe('body{color:blue}');
    expect(style.sheet.cssRules[1].cssText).toBe('body{color:red}');
    expect(style.sheet.cssRules[2].cssText).toBe('body{color:yellow}');

    style.sheet.deleteRule(1);
    expect(style.sheet.cssRules).toHaveLength(2);
    expect(style.sheet.cssRules[0].cssText).toBe('body{color:blue}');
    expect(style.sheet.cssRules[1].cssText).toBe('body{color:yellow}');

    style.sheet.deleteRule(88);
    expect(style.sheet.cssRules).toHaveLength(2);

    style.sheet.deleteRule(-88);
    expect(style.sheet.cssRules).toHaveLength(2);
  });

  it('sheet', () => {
    expect(style.sheet).toBeDefined();
    expect(style.sheet.ownerNode).toBe(style);
    expect(style.sheet.type).toBe('text/css');
    expect(style.sheet.parentStyleSheet).toBe(null);
    expect(style.sheet.cssRules).toHaveLength(0);
  });

  it('document.styleSheets', () => {
    expect(doc.styleSheets).toHaveLength(1);
    const style2 = doc.createElement('style');
    doc.head.appendChild(style2);
    expect(doc.styleSheets).toHaveLength(2);
  });
});
