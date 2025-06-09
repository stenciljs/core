import { MockDocument } from '../document';
import { MockAnchorElement, MockMetaElement, MockSVGElement, MockUListElement } from '../element';
import { MockElement, MockHTMLElement } from '../node';
import { cloneWindow, MockWindow } from '../window';

describe('element', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument('');
  });

  it('document.documentElement dir', () => {
    expect(doc.dir).toBe('');
    expect(doc.documentElement.getAttribute('dir')).toBe(null);
    doc.documentElement.setAttribute('dir', 'rtl');
    expect(doc.documentElement.getAttribute('dir')).toBe('rtl');
    expect(doc.dir).toBe('rtl');
  });

  it('document.dir', () => {
    expect(doc.dir).toBe('');
    doc.dir = 'ltr';
    expect(doc.dir).toBe('ltr');
    doc.dir = 'rtl';
    expect(doc.dir).toBe('rtl');
  });

  it('insertAdjacentElement beforebegin', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    const insertElm = doc.createElement('i');
    insertElm.textContent = 'c';
    elm.insertAdjacentElement('beforebegin', insertElm);
    expect(doc.body).toEqualHtml(`<body><i>c</i><div><b>0</b></div></body>`);
  });

  it('insertAdjacentElement afterbegin', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    const insertElm = doc.createElement('i');
    insertElm.textContent = 'c';
    elm.insertAdjacentElement('afterbegin', insertElm);
    expect(doc.body).toEqualHtml(`<body><div><i>c</i><b>0</b></div></body>`);
  });

  it('insertAdjacentElement beforeend', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    const insertElm = doc.createElement('i');
    insertElm.textContent = 'c';
    elm.insertAdjacentElement('beforeend', insertElm);
    expect(doc.body).toEqualHtml(`<body><div><b>0</b><i>c</i></div></body>`);
  });

  it('insertAdjacentElement afterend', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    const insertElm = doc.createElement('i');
    insertElm.textContent = 'c';
    elm.insertAdjacentElement('afterend', insertElm);
    expect(doc.body).toEqualHtml(`<body><div><b>0</b></div><i>c</i></body>`);
  });

  it('insertAdjacentText beforebegin', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    elm.insertAdjacentText('beforebegin', 'a');
    expect(doc.body).toEqualHtml(`<body>a<div><b>0</b></div></body>`);
  });

  it('insertAdjacentText afterbegin', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    elm.insertAdjacentText('afterbegin', 'a');
    expect(doc.body).toEqualHtml(`<body><div>a<b>0</b></div></body>`);
  });

  it('insertAdjacentText beforeend', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    elm.insertAdjacentText('beforeend', 'a');
    expect(doc.body).toEqualHtml(`<body><div><b>0</b>a</div></body>`);
  });

  it('insertAdjacentText afterend', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    elm.insertAdjacentText('afterend', 'a');
    expect(doc.body).toEqualHtml(`<body><div><b>0</b></div>a</body>`);
  });

  it('insertAdjacentHTML beforebegin', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.textContent = '0';
    doc.body.appendChild(elm);
    elm.insertAdjacentHTML('beforebegin', '<b>88</b>mph');
    expect(doc.body).toEqualHtml(`<body><b>88</b>mph<div>0</div></body>`);
  });

  it('insertAdjacentHTML afterbegin', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.textContent = '0';
    doc.body.appendChild(elm);
    elm.insertAdjacentHTML('afterbegin', '<b>88</b>mph<i>!</i>');
    expect(doc.body).toEqualHtml(`<body><div><b>88</b>mph<i>!</i>0</div></body>`);
  });

  it('insertAdjacentHTML beforeend', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.textContent = '0';
    doc.body.appendChild(elm);
    elm.insertAdjacentHTML('beforeend', '<b>88</b>mph<i>!</i>');
    expect(doc.body).toEqualHtml(`<body><div>0<b>88</b>mph<i>!</i></div></body>`);
  });

  it('insertAdjacentHTML afterend', () => {
    const elm = doc.createElement('div') as MockHTMLElement;
    elm.innerHTML = '<b>0</b>';
    doc.body.appendChild(elm);
    elm.insertAdjacentHTML('afterend', 'a');
    expect(doc.body).toEqualHtml(`<body><div><b>0</b></div>a</body>`);
  });

  it('clone elements', () => {
    const win = new MockWindow(`
      <html>
        <head>
          <meta id="test">
        </head>
        <body></body>
      </head>
    `);

    const clonedWin = cloneWindow(win as any);

    if (!clonedWin) {
      throw new Error('The Window was not successfully cloned!');
    }

    const elm = clonedWin.document.getElementById('test') as any;
    expect((elm as HTMLMetaElement).content).toBe('');
    expect(elm).toEqualHtml(`<meta id="test">`);

    (elm as HTMLMetaElement).content = 'value';
    expect((elm as HTMLMetaElement).content).toBe('value');
    expect(elm).toEqualHtml(`<meta id="test" content="value">`);

    clonedWin.document.title = 'Hello Title!';
    const titleElm = clonedWin.document.head.querySelector('title');
    expect(titleElm).toEqualHtml(`<title>Hello Title!</title>`);

    // we just asserted that this object isn't falsy, allowing us to use the bang operator here
    titleElm!.text = 'Hello Text!';
    expect(titleElm).toEqualHtml(`<title>Hello Text!</title>`);
  });

  it('meta content', () => {
    const metaElm = doc.createElement('meta');
    metaElm.content = 'value';
    metaElm.id = 'test';
    doc.head.appendChild(metaElm);
    expect(metaElm).toEqualHtml(`<meta content="value" id="test">`);

    const elm = doc.getElementById('test') as MockMetaElement;
    expect(elm).toEqualHtml(`<meta content="value" id="test">`);

    elm['content'] = 'updated';
    expect(elm).toEqualHtml(`<meta content="updated" id="test">`);
  });

  describe('document', () => {
    it('styleSheets', () => {
      expect(document.styleSheets).toEqual([]);
      const style = document.createElement('style');
      document.head.appendChild(style);
      expect(document.styleSheets).toEqual([style]);
    });

    it('forms', () => {
      expect(document.forms).toEqual([]);
      const form = document.createElement('form');
      document.head.appendChild(form);
      expect(document.forms).toEqual([form]);
    });

    it('scripts', () => {
      expect(document.scripts).toEqual([]);
      const script = document.createElement('script');
      document.head.appendChild(script);
      expect(document.scripts).toEqual([script]);
    });

    it('images', () => {
      expect(document.images).toEqual([]);
      const img = document.createElement('img');
      document.head.appendChild(img);
      expect(document.images).toEqual([img]);
    });

    it('scrollingElement', () => {
      expect(document.scrollingElement).toBe(document.documentElement);
    });

    it('title', () => {
      document.title = 'Hello Title';
      expect(document.title).toBe('Hello Title');

      const titleElm = document.head.querySelector('title');

      if (!titleElm) {
        throw new Error('Unable to find title element in the DOM.');
      }

      expect(titleElm.textContent).toBe('Hello Title');
      expect(titleElm.text).toBe('Hello Title');

      titleElm.text = 'Hello Text';
      expect(document.title).toBe('Hello Text');
      expect(titleElm.text).toBe('Hello Text');
      expect(titleElm.textContent).toBe('Hello Text');
    });

    it('document.baseURI', () => {
      const win = new MockWindow(`
      <html>
        <head>
          <base href="/en">
        </head>
      </head>
      `);
      win.location.href = 'http://stenciljs.com/path/to/page';
      expect(win.document.baseURI).toBe('http://stenciljs.com/en');
      expect(win.document.URL).toBe('http://stenciljs.com/path/to/page');
      expect(win.document.location.href).toBe('http://stenciljs.com/path/to/page');

      // use the bang operator here to fail in case 'base' can't be found
      win.document.querySelector('base')!.remove();
      expect(win.document.baseURI).toBe('http://stenciljs.com/path/to/page');
      expect(win.document.URL).toBe('http://stenciljs.com/path/to/page');
      expect(win.document.location.href).toBe('http://stenciljs.com/path/to/page');
    });
  });

  describe('contains', () => {
    it('returns true when a node is an direct child of a given node', () => {
      const root = document.createElement('div');
      const span = document.createElement('span');

      root.appendChild(span);

      expect(root.contains(span)).toEqual(true);
    });

    it('returns true when a node is an indirect child of a given node', () => {
      const root = document.createElement('div');
      const span = document.createElement('span');
      const h1 = document.createElement('h1');

      root.appendChild(span);
      span.appendChild(h1);

      expect(root.contains(h1)).toEqual(true);
    });

    it('returns true when a node is the given node itself', () => {
      const root = document.createElement('div');
      expect(root.contains(root)).toEqual(true);
    });

    it('returns false when a node is not the given node itself or not a descendant of the given node', () => {
      const root = document.createElement('div');
      const span = document.createElement('span');
      expect(root.contains(span)).toEqual(false);
    });
  });

  describe('isConnected', () => {
    it('nested true', () => {
      const elmParent = document.createElement('div');
      const elmChild = document.createElement('div');
      elmParent.appendChild(elmChild);
      expect(document.body.contains(elmParent)).toBe(false);
      document.body.appendChild(elmParent);
      expect(document.body.contains(elmParent)).toBe(true);
      expect(elmParent.isConnected).toBe(true);
      expect(elmChild.isConnected).toBe(true);
      expect(document.body.isConnected).toBe(true);
      expect(document.documentElement.isConnected).toBe(true);
      expect(document.isConnected).toBe(true);
    });

    it('true', () => {
      const elm = document.createElement('div');
      document.body.appendChild(elm);
      expect(elm.isConnected).toBe(true);
    });

    it('false', () => {
      const elm = document.createElement('div');
      expect(elm.isConnected).toBe(false);
    });
  });

  describe('append', () => {
    it('nothing', () => {
      const elm = doc.createElement('div') as Element;
      elm.append();
      expect(elm.childNodes).toEqual([]);
    });
    it('one element', () => {
      const elm = doc.createElement('div') as Element;
      const child = doc.createElement('div') as Element;
      elm.append(child);
      expect(elm.childNodes).toEqual([child]);
    });
    it('one text', () => {
      const elm = doc.createElement('div') as Element;
      elm.append('text');
      expect(elm.childNodes.length).toEqual(1);
      expect((elm.childNodes[0] as Text).data).toEqual('text');
    });
    it('multiple texts', () => {
      const elm = doc.createElement('div') as Element;
      elm.append('text', 'some text');
      expect(elm.childNodes.length).toEqual(2);
      expect((elm.childNodes[0] as Text).data).toEqual('text');
      expect((elm.childNodes[1] as Text).data).toEqual('some text');
    });
    it('mixed', () => {
      const elm = doc.createElement('div') as Element;
      const child = doc.createElement('div') as Element;

      elm.append('text', 12 as any, child, null as unknown as Node);
      expect(elm.childNodes.length).toEqual(4);
      expect((elm.childNodes[0] as Text).data).toEqual('text');
      expect((elm.childNodes[1] as Text).data).toEqual('12');
      expect(elm.childNodes[2]).toEqual(child);
      // we used type assertions above to verify that `null`'s text reads a 'null'
      expect((elm.childNodes[3] as Text).data).toEqual('null');
    });
  });

  describe('prepend', () => {
    it('before node', () => {
      const elm = doc.createElement('div') as Element;
      const original = doc.createElement('div') as Element;
      const child = doc.createElement('div') as Element;
      elm.append(original);
      elm.prepend('text', 12 as any, child);

      expect(elm.childNodes.length).toEqual(4);
      expect((elm.childNodes[0] as Text).data).toEqual('text');
      expect((elm.childNodes[1] as Text).data).toEqual('12');
      expect(elm.childNodes[2]).toEqual(child);
      expect(elm.childNodes[3]).toEqual(original);
    });

    it('before text', () => {
      const elm = doc.createElement('div') as Element;
      const child = doc.createElement('div') as Element;
      elm.append('original');
      elm.prepend('text', 12 as any, child);

      expect(elm.childNodes.length).toEqual(4);
      expect((elm.childNodes[0] as Text).data).toEqual('text');
      expect((elm.childNodes[1] as Text).data).toEqual('12');
      expect(elm.childNodes[2]).toEqual(child);
      expect((elm.childNodes[3] as Text).data).toEqual('original');
    });
  });

  it('getBoundingClientRect', () => {
    const elm = doc.createElement('div');
    const rect = elm.getBoundingClientRect();

    expect(rect).toEqual({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    });
  });

  describe('namespaceURI', () => {
    it('HTMLElement namespaceURI is always http://www.w3.org/1999/xhtml', () => {
      const htmlElement = new MockHTMLElement(doc, 'svg');
      expect(htmlElement.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');

      const createdElement1 = doc.createElement('div');
      expect(createdElement1.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');

      const createdElement2 = doc.createElement('svg');
      expect(createdElement2.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(createdElement2 instanceof MockHTMLElement).toBe(true);

      const createdElement3 = doc.createElementNS('http://www.w3.org/1999/xhtml', 'svg');
      expect(createdElement3.namespaceURI).toEqual('http://www.w3.org/1999/xhtml');
      expect(createdElement3 instanceof MockHTMLElement).toBe(true);
    });

    it('Element namespace is null by defualt', () => {
      const element = new MockElement(doc, 'svg');
      expect(element.namespaceURI).toEqual(null);
    });

    it('createElementNS sets the namespace', () => {
      const element = doc.createElementNS('random', 'svg');
      expect(element.namespaceURI).toEqual('random');
      expect(element instanceof MockSVGElement).toBe(false);

      const element1 = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      expect(element1.namespaceURI).toEqual('http://www.w3.org/2000/svg');
      expect(element1 instanceof MockSVGElement).toBe(true);
    });
  });

  describe('tagName', () => {
    it('Element tagName/nodeName is case sensible', () => {
      const element = new MockElement(doc, 'myElement');
      expect(element.tagName).toEqual('myElement');
      expect(element.nodeName).toEqual('myElement');

      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      expect(foreignObject.tagName).toEqual('foreignObject');
      expect(foreignObject.nodeName).toEqual('foreignObject');
    });

    it('HTMLElement tagName/nodeName is case insensible', () => {
      const element = new MockHTMLElement(doc, 'myElement');
      expect(element.tagName).toEqual('MYELEMENT');
      expect(element.nodeName).toEqual('MYELEMENT');

      const foreignObject = document.createElement('foreignObject');
      expect(foreignObject.tagName).toEqual('FOREIGNOBJECT');
      expect(foreignObject.nodeName).toEqual('FOREIGNOBJECT');

      const foreignObject2 = document.createElementNS('http://www.w3.org/1999/xhtml', 'foreignObject');
      expect(foreignObject2.tagName).toEqual('FOREIGNOBJECT');
      expect(foreignObject2.nodeName).toEqual('FOREIGNOBJECT');

      const createdElement = document.createElement('myElement');
      expect(createdElement.tagName).toEqual('MYELEMENT');
      expect(createdElement.nodeName).toEqual('MYELEMENT');
    });
  });

  describe('parentElement', () => {
    it('returns `null` for when accessing the parent element of an html node', () => {
      const element = new MockHTMLElement(doc, 'myElement');
      expect(element.parentElement).toEqual(null);
    });
  });

  describe('input', () => {
    it('list is readonly prop', () => {
      const input = doc.createElement('input');
      const list = doc.createElement('datalist');
      list.id = 'my-list';
      doc.body.append(input, list);
      expect(input.list).toEqual(null);

      // it's readonly
      expect(() => (input.list = 'my-list')).toThrow();
      expect(input.list).toEqual(null);

      // finds list
      input.setAttribute('list', 'my-list');
      expect(input.list).toEqual(list);

      // unknown id
      input.setAttribute('list', 'unknown');
      expect(input.list).toEqual(null);
    });
  });

  describe('link', () => {
    it('href', () => {
      const elm: MockAnchorElement = doc.createElement('a');
      elm.href = 'http://stenciljs.com/path/to/page';
      expect(elm.href).toBe('http://stenciljs.com/path/to/page');
    });

    it('pathname', () => {
      const elm: MockAnchorElement = doc.createElement('a');
      elm.href = 'http://stenciljs.com/path/to/page';
      expect(elm.pathname).toBe('/path/to/page');
    });
  });

  describe('ul', () => {
    it('textContent', () => {
      const elm: MockUListElement = doc.createElement('ul');
      elm.textContent = 'this is an item in an unordered list';
      expect(elm.textContent).toBe('this is an item in an unordered list');
    });
  });

  it('provides a localName', () => {
    expect(doc.createElement('input').localName).toBe('input');
    expect(doc.createElement('a').localName).toBe('a');
    expect(doc.createElement('datalist').localName).toBe('datalist');
    expect(doc.createElement('svg').localName).toBe('svg');
    expect((document.childNodes[1] as any).localName).toBe('html');
  });

  it('has provides a canvas object with getContext', () => {
    const canvas = doc.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).toBeDefined();
    expect(ctx.toDataURL()).toBe('data:,');
  });

  describe('slot', () => {
    it('returns no nodes via `assignedNodes` / `assignedElements` when not within a custom element', () => {
      const slot = doc.createElement('slot');
      slot.innerHTML = 'invisible <div>Something</div> <!-- not here -->';
      expect(slot.assignedNodes().length).toEqual(0);
      expect(slot.assignedElements().length).toEqual(0);
    });

    it('returns correct nodes with `assignedNodes`', () => {
      const elm = doc.createElement('cmp-a');
      const shadowRoot = elm.attachShadow({ mode: 'open' });
      const slot = doc.createElement('slot');
      shadowRoot.appendChild(slot);
      slot.innerHTML = '<slot name="nested-slot">Fallback content</slot>';

      elm.innerHTML = `
        text node 
        <div>light dom</div>
        <!-- comment node -->
        <div slot="nested-slot">nested slot</div>
      `;

      expect(slot.assignedNodes().length).toEqual(5);
      expect(slot.assignedNodes()[0].textContent.trim()).toEqual('text node');
      expect(slot.assignedNodes()[1].textContent.trim()).toEqual('light dom');
      expect(slot.assignedNodes()[3].textContent.trim()).toEqual('comment node');
      expect(slot.assignedNodes()[4].textContent.trim()).toEqual('');
      expect(slot.assignedNodes({ flatten: true }).length).toEqual(5);

      elm.innerHTML = '<div slot="nested-slot">nested slot</div>';

      expect(slot.assignedNodes().length).toEqual(0);
      expect(slot.assignedNodes({ flatten: true }).length).toEqual(1);
      expect(slot.assignedNodes({ flatten: true })[0].textContent.trim()).toEqual('nested slot');

      elm.innerHTML = 'text node <div slot="nested-slot">nested slot</div>';

      expect(slot.assignedNodes().length).toEqual(1);
      expect(slot.assignedNodes({ flatten: true }).length).toEqual(1);
      expect(slot.assignedNodes()[0].textContent.trim()).toEqual('text node');

      elm.innerHTML = '';
      expect(slot.assignedNodes().length).toEqual(0);
      expect(slot.assignedNodes({ flatten: true }).length).toEqual(1);
      expect(slot.assignedNodes({ flatten: true })[0].textContent.trim()).toEqual('Fallback content');
    });

    it('returns correct elements with `assignedElements`', () => {
      const elm = doc.createElement('cmp-a');
      const shadowRoot = elm.attachShadow({ mode: 'open' });
      const slot = doc.createElement('slot');
      shadowRoot.appendChild(slot);
      slot.innerHTML = '<slot name="nested-slot"><div>Fallback content</div></slot>';

      elm.innerHTML = `
        text node 
        <div>light dom</div>
        <!-- comment node -->
        <div slot="nested-slot">nested slot</div>
      `;

      expect(slot.assignedElements().length).toEqual(1);
      expect(slot.assignedElements()[0].textContent.trim()).toEqual('light dom');
      expect(slot.assignedElements({ flatten: true }).length).toEqual(1);

      elm.innerHTML = '<div slot="nested-slot">nested slot</div>';

      expect(slot.assignedElements().length).toEqual(0);
      expect(slot.assignedElements({ flatten: true }).length).toEqual(1);
      expect(slot.assignedElements({ flatten: true })[0].textContent.trim()).toEqual('nested slot');

      elm.innerHTML = 'text node <div slot="nested-slot">nested slot</div>';

      expect(slot.assignedElements().length).toEqual(0);
      expect(slot.assignedElements({ flatten: true }).length).toEqual(1);
      expect(slot.assignedElements({ flatten: true })[0].textContent.trim()).toEqual('nested slot');

      elm.innerHTML = '';
      expect(slot.assignedElements().length).toEqual(0);
      expect(slot.assignedElements({ flatten: true }).length).toEqual(1);
      expect(slot.assignedElements({ flatten: true })[0].textContent.trim()).toEqual('Fallback content');
    });
  });
});
