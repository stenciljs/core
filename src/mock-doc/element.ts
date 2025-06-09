import { cloneAttributes } from './attribute';
import { NODE_TYPES } from './constants';
import { getStyleElementText, MockCSSStyleSheet, setStyleElementText } from './css-style-sheet';
import { createCustomElement } from './custom-element-registry';
import { MockDocumentFragment } from './document-fragment';
import { MockElement, MockHTMLElement, MockNode } from './node';

export function createElement(ownerDocument: any, tagName: string): any {
  if (typeof tagName !== 'string' || tagName === '' || !/^[a-z0-9-_:]+$/i.test(tagName)) {
    throw new Error(`The tag name provided (${tagName}) is not a valid name.`);
  }
  tagName = tagName.toLowerCase();

  switch (tagName) {
    case 'a':
      return new MockAnchorElement(ownerDocument);

    case 'base':
      return new MockBaseElement(ownerDocument);

    case 'button':
      return new MockButtonElement(ownerDocument);

    case 'canvas':
      return new MockCanvasElement(ownerDocument);

    case 'form':
      return new MockFormElement(ownerDocument);

    case 'img':
      return new MockImageElement(ownerDocument);

    case 'input':
      return new MockInputElement(ownerDocument);

    case 'link':
      return new MockLinkElement(ownerDocument);

    case 'meta':
      return new MockMetaElement(ownerDocument);

    case 'script':
      return new MockScriptElement(ownerDocument);

    case 'slot':
      return new MockSlotElement(ownerDocument);

    case 'slot-fb':
      return new MockHTMLElement(ownerDocument, tagName);

    case 'style':
      return new MockStyleElement(ownerDocument);

    case 'template':
      return new MockTemplateElement(ownerDocument);

    case 'title':
      return new MockTitleElement(ownerDocument);

    case 'ul':
      return new MockUListElement(ownerDocument);
  }

  if (ownerDocument != null && tagName.includes('-')) {
    const win = ownerDocument.defaultView;
    if (win != null && win.customElements != null) {
      return createCustomElement(win.customElements, ownerDocument, tagName);
    }
  }

  return new MockHTMLElement(ownerDocument, tagName);
}

export function createElementNS(ownerDocument: any, namespaceURI: string, tagName: string) {
  if (namespaceURI === 'http://www.w3.org/1999/xhtml') {
    return createElement(ownerDocument, tagName);
  } else if (namespaceURI === 'http://www.w3.org/2000/svg') {
    switch (tagName.toLowerCase()) {
      case 'text':
      case 'tspan':
      case 'tref':
      case 'altglyph':
      case 'textpath':
        return new MockSVGTextContentElement(ownerDocument, tagName);
      case 'circle':
      case 'ellipse':
      case 'image':
      case 'line':
      case 'path':
      case 'polygon':
      case 'polyline':
      case 'rect':
      case 'use':
        return new MockSVGGraphicsElement(ownerDocument, tagName);
      case 'svg':
        return new MockSVGSVGElement(ownerDocument, tagName);
      default:
        return new MockSVGElement(ownerDocument, tagName);
    }
  } else {
    return new MockElement(ownerDocument, tagName, namespaceURI);
  }
}

export class MockAnchorElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'a');
  }

  get href() {
    return fullUrl(this, 'href');
  }
  set href(value: string) {
    this.setAttribute('href', value);
  }
  get pathname() {
    if (!this.href) {
      return '';
    }
    return new URL(this.href).pathname;
  }
}

export class MockButtonElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'button');
  }
}
patchPropAttributes(
  MockButtonElement.prototype,
  {
    type: String,
  },
  {
    type: 'submit',
  },
);

Object.defineProperty(MockButtonElement.prototype, 'form', {
  get(this: MockElement) {
    return this.hasAttribute('form') ? this.getAttribute('form') : null;
  },
});

export class MockImageElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'img');
  }

  override get draggable() {
    return this.getAttributeNS(null, 'draggable') !== 'false';
  }
  override set draggable(value: boolean) {
    this.setAttributeNS(null, 'draggable', value);
  }

  get src() {
    return fullUrl(this, 'src');
  }
  set src(value: string) {
    this.setAttribute('src', value);
  }
}
patchPropAttributes(MockImageElement.prototype, {
  height: Number,
  width: Number,
});

export class MockInputElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'input');
  }

  get list() {
    const listId = this.getAttribute('list');
    if (listId) {
      return (this.ownerDocument as Document).getElementById(listId);
    }
    return null;
  }
}

patchPropAttributes(
  MockInputElement.prototype,
  {
    accept: String,
    autocomplete: String,
    autofocus: Boolean,
    capture: String,
    checked: Boolean,
    disabled: Boolean,
    form: String,
    formaction: String,
    formenctype: String,
    formmethod: String,
    formnovalidate: String,
    formtarget: String,
    height: Number,
    inputmode: String,
    max: String,
    maxLength: Number,
    min: String,
    minLength: Number,
    multiple: Boolean,
    name: String,
    pattern: String,
    placeholder: String,
    required: Boolean,
    readOnly: Boolean,
    size: Number,
    spellCheck: Boolean,
    src: String,
    step: String,
    type: String,
    value: String,
    width: Number,
  },
  {
    type: 'text',
  },
);

export class MockFormElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'form');
  }
}
patchPropAttributes(MockFormElement.prototype, {
  name: String,
});

export class MockLinkElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'link');
  }

  get href() {
    return fullUrl(this, 'href');
  }
  set href(value: string) {
    this.setAttribute('href', value);
  }
}
patchPropAttributes(MockLinkElement.prototype, {
  crossorigin: String,
  media: String,
  rel: String,
  type: String,
});

export class MockMetaElement extends MockHTMLElement {
  content: string;

  constructor(ownerDocument: any) {
    super(ownerDocument, 'meta');
  }
}
patchPropAttributes(MockMetaElement.prototype, {
  charset: String,
  content: String,
  name: String,
});

export class MockScriptElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'script');
  }

  get src() {
    return fullUrl(this, 'src');
  }
  set src(value: string) {
    this.setAttribute('src', value);
  }
}
patchPropAttributes(MockScriptElement.prototype, {
  type: String,
});

export class MockDOMMatrix {
  static fromMatrix() {
    return new MockDOMMatrix();
  }
  a: number = 1;
  b: number = 0;
  c: number = 0;
  d: number = 1;
  e: number = 0;
  f: number = 0;
  m11: number = 1;
  m12: number = 0;
  m13: number = 0;
  m14: number = 0;
  m21: number = 0;
  m22: number = 1;
  m23: number = 0;
  m24: number = 0;
  m31: number = 0;
  m32: number = 0;
  m33: number = 1;
  m34: number = 0;
  m41: number = 0;
  m42: number = 0;
  m43: number = 0;
  m44: number = 1;
  is2D: boolean = true;
  isIdentity: boolean = true;
  inverse() {
    return new MockDOMMatrix();
  }
  flipX() {
    return new MockDOMMatrix();
  }
  flipY() {
    return new MockDOMMatrix();
  }
  multiply() {
    return new MockDOMMatrix();
  }
  rotate() {
    return new MockDOMMatrix();
  }
  rotateAxisAngle() {
    return new MockDOMMatrix();
  }
  rotateFromVector() {
    return new MockDOMMatrix();
  }
  scale() {
    return new MockDOMMatrix();
  }
  scaleNonUniform() {
    return new MockDOMMatrix();
  }
  skewX() {
    return new MockDOMMatrix();
  }
  skewY() {
    return new MockDOMMatrix();
  }
  toJSON() {}
  toString() {}
  transformPoint() {
    return new MockDOMPoint();
  }
  translate() {
    return new MockDOMMatrix();
  }
}

export class MockDOMPoint {
  w: number = 1;
  x: number = 0;
  y: number = 0;
  z: number = 0;
  toJSON() {}
  matrixTransform() {
    return new MockDOMMatrix();
  }
}

export class MockSVGRect {
  height: number = 10;
  width: number = 10;
  x: number = 0;
  y: number = 0;
}

export class MockStyleElement extends MockHTMLElement {
  sheet: MockCSSStyleSheet;

  constructor(ownerDocument: any) {
    super(ownerDocument, 'style');
    this.sheet = new MockCSSStyleSheet(this);
  }

  override get innerHTML() {
    return getStyleElementText(this);
  }
  override set innerHTML(value: string) {
    setStyleElementText(this, value);
  }

  override get innerText() {
    return getStyleElementText(this);
  }
  override set innerText(value: string) {
    setStyleElementText(this, value);
  }

  override get textContent() {
    return getStyleElementText(this);
  }
  override set textContent(value: string) {
    setStyleElementText(this, value);
  }
}
export class MockSVGElement extends MockElement {
  override __namespaceURI = 'http://www.w3.org/2000/svg';

  // SVGElement properties and methods
  get ownerSVGElement(): SVGSVGElement {
    return null;
  }
  get viewportElement(): SVGElement {
    return null;
  }
  onunload() {
    /**/
  }

  // SVGGeometryElement properties and methods
  get pathLength(): number {
    return 0;
  }

  isPointInFill(_pt: DOMPoint): boolean {
    return false;
  }
  isPointInStroke(_pt: DOMPoint): boolean {
    return false;
  }
  getTotalLength(): number {
    return 0;
  }
}

export class MockSVGGraphicsElement extends MockSVGElement {
  getBBox(_options?: { clipped: boolean; fill: boolean; markers: boolean; stroke: boolean }): MockSVGRect {
    return new MockSVGRect();
  }
  getCTM(): MockDOMMatrix {
    return new MockDOMMatrix();
  }
  getScreenCTM(): MockDOMMatrix {
    return new MockDOMMatrix();
  }
}

export class MockSVGSVGElement extends MockSVGGraphicsElement {
  createSVGPoint(): MockDOMPoint {
    return new MockDOMPoint();
  }
}

export class MockSVGTextContentElement extends MockSVGGraphicsElement {
  getComputedTextLength(): number {
    return 0;
  }
}

export class MockBaseElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'base');
  }

  get href() {
    return fullUrl(this, 'href');
  }
  set href(value: string) {
    this.setAttribute('href', value);
  }
}

export class MockTemplateElement extends MockHTMLElement {
  content: MockDocumentFragment;

  constructor(ownerDocument: any) {
    super(ownerDocument, 'template');
    this.content = new MockDocumentFragment(ownerDocument);
  }

  override get innerHTML() {
    return this.content.innerHTML;
  }
  override set innerHTML(html: string) {
    this.content.innerHTML = html;
  }

  override cloneNode(deep?: boolean) {
    const cloned = new MockTemplateElement(null);
    cloned.attributes = cloneAttributes(this.attributes);

    const styleCssText = this.getAttribute('style');
    if (styleCssText != null && styleCssText.length > 0) {
      cloned.setAttribute('style', styleCssText);
    }

    cloned.content = this.content.cloneNode(deep);

    if (deep) {
      for (let i = 0, ii = this.childNodes.length; i < ii; i++) {
        const clonedChildNode = this.childNodes[i].cloneNode(true);
        cloned.appendChild(clonedChildNode);
      }
    }

    return cloned;
  }
}

export class MockTitleElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'title');
  }

  get text() {
    return this.textContent;
  }
  set text(value: string) {
    this.textContent = value;
  }
}

export class MockUListElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'ul');
  }
}

export class MockSlotElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'slot');
  }

  assignedNodes(opts?: { flatten: boolean }): (MockNode | Node)[] {
    let nodesToReturn: (MockNode | Node)[] = [];

    const ownerHost = (this.getRootNode() as any).host as MockElement;
    if (!ownerHost) return nodesToReturn;

    if (ownerHost.childNodes.length) {
      // try to find lightDOM nodes matching this slot's name (or lack of)
      if ((this as any).name) {
        nodesToReturn = ownerHost.childNodes.filter(
          (n) =>
            n.nodeType === NODE_TYPES.ELEMENT_NODE && (n as MockElement).getAttribute('slot') === (this as any).name,
        );
      } else {
        // find elements that do not have a slot attribute or
        // any other type of node
        nodesToReturn = ownerHost.childNodes.filter(
          (n) =>
            (n.nodeType === NODE_TYPES.ELEMENT_NODE && !(n as MockElement).getAttribute('slot')) ||
            n.nodeType !== NODE_TYPES.ELEMENT_NODE,
        );
      }
      if (nodesToReturn.length) return nodesToReturn;
    }

    // no flatten option? Return whatever's in this slot (without nested slots)
    if (!opts?.flatten) return this.childNodes.filter((n) => !(n instanceof MockSlotElement));

    // flatten option? Return all nodes in this slot (including anything within nested slots)
    return this.childNodes.reduce(
      (acc, node) => {
        if (node instanceof MockSlotElement) {
          acc.push(...node.assignedNodes(opts));
        } else {
          acc.push(node);
        }
        return acc;
      },
      [] as (MockNode | Node)[],
    );
  }

  assignedElements(opts?: { flatten: boolean }): (Element | MockHTMLElement)[] {
    let elesToReturn: (Element | MockHTMLElement)[] = [];

    const ownerHost = (this.getRootNode() as any).host as MockElement;
    if (!ownerHost) return elesToReturn;

    if (ownerHost.children.length) {
      // try to find lightDOM elements matching this slot's name (or lack of)
      if ((this as any).name) {
        elesToReturn = ownerHost.children.filter((n) => (n as MockElement).getAttribute('slot') == (this as any).name);
      } else {
        elesToReturn = ownerHost.children.filter((n) => !(n as MockElement).getAttribute('slot'));
      }
      if (elesToReturn.length) return elesToReturn;
    }

    // no flatten option? Return whatever elements are in this slot (without nested slots)
    if (!opts?.flatten) return this.children.filter((n) => !(n instanceof MockSlotElement));

    // flatten option? Return all elements in this slot (including anything within nested slots)
    return this.children.reduce(
      (acc, node) => {
        if (node instanceof MockSlotElement) {
          acc.push(...node.assignedElements(opts));
        } else {
          acc.push(node);
        }
        return acc;
      },
      [] as (MockElement | Element)[],
    );
  }
}

patchPropAttributes(MockSlotElement.prototype, {
  name: String,
});

type CanvasContext = '2d' | 'webgl' | 'webgl2' | 'bitmaprenderer';
export class CanvasRenderingContext {
  context: CanvasContext;
  contextAttributes: WebGLContextAttributes;
  constructor(context: CanvasContext, contextAttributes?: WebGLContextAttributes) {
    this.context = context;
    this.contextAttributes = contextAttributes;
  }
  fillRect() {
    return;
  }
  clearRect() {}
  getImageData(_: number, __: number, w: number, h: number) {
    return {
      data: new Array(w * h * 4),
    };
  }
  toDataURL() {
    return 'data:,'; // blank image
  }
  putImageData() {}
  createImageData(): ImageData {
    return {} as ImageData;
  }
  setTransform() {}
  drawImage() {}
  save() {}
  fillText() {}
  restore() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  stroke() {}
  translate() {}
  scale() {}
  rotate() {}
  arc() {}
  fill() {}
  measureText() {
    return { width: 0 };
  }
  transform() {}
  rect() {}
  clip() {}
}

export class MockCanvasElement extends MockHTMLElement {
  constructor(ownerDocument: any) {
    super(ownerDocument, 'canvas');
  }
  getContext(context: CanvasContext, contextAttributes?: WebGLContextAttributes): CanvasRenderingContext {
    return new CanvasRenderingContext(context, contextAttributes);
  }
}

function fullUrl(elm: MockElement, attrName: string) {
  const val = elm.getAttribute(attrName) || '';
  if (elm.ownerDocument != null) {
    const win = elm.ownerDocument.defaultView as Window;
    if (win != null) {
      const loc = win.location;
      if (loc != null) {
        try {
          const url = new URL(val, loc.href);
          return url.href;
        } catch (e) {}
      }
    }
  }
  return val.replace(/\'|\"/g, '').trim();
}

function patchPropAttributes(prototype: any, attrs: any, defaults: any = {}) {
  Object.keys(attrs).forEach((propName) => {
    const attr = attrs[propName];
    const defaultValue = defaults[propName];

    if (attr === Boolean) {
      Object.defineProperty(prototype, propName, {
        get(this: MockElement) {
          return this.hasAttribute(propName);
        },
        set(this: MockElement, value: boolean) {
          if (value) {
            this.setAttribute(propName, '');
          } else {
            this.removeAttribute(propName);
          }
        },
      });
    } else if (attr === Number) {
      Object.defineProperty(prototype, propName, {
        get(this: MockElement) {
          const value = this.getAttribute(propName);
          return value ? parseInt(value, 10) : defaultValue === undefined ? 0 : defaultValue;
        },
        set(this: MockElement, value: boolean) {
          this.setAttribute(propName, value);
        },
      });
    } else {
      Object.defineProperty(prototype, propName, {
        get(this: MockElement) {
          return this.hasAttribute(propName) ? this.getAttribute(propName) : defaultValue || '';
        },
        set(this: MockElement, value: boolean) {
          this.setAttribute(propName, value);
        },
      });
    }
  });
}

MockElement.prototype.cloneNode = function (this: MockElement, deep?: boolean) {
  // because we're creating elements, which extending specific HTML base classes there
  // is a MockElement circular reference that bundling has trouble dealing with so
  // the fix is to add cloneNode() to MockElement's prototype after the HTML classes
  const cloned = createElement(this.ownerDocument, this.nodeName);
  cloned.attributes = cloneAttributes(this.attributes);

  const styleCssText = this.getAttribute('style');
  if (styleCssText != null && styleCssText.length > 0) {
    cloned.setAttribute('style', styleCssText);
  }

  if (deep) {
    for (let i = 0, ii = this.childNodes.length; i < ii; i++) {
      const clonedChildNode = this.childNodes[i].cloneNode(true);
      cloned.appendChild(clonedChildNode);
    }
  }

  return cloned;
};
