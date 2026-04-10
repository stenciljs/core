import nwsapi from 'nwsapi';

import { MockAttr } from './attribute';
import { MockComment } from './comment-node';
import { NODE_NAMES, NODE_TYPES } from './constants';
import { MockDocumentFragment } from './document-fragment';
import { MockDocumentTypeNode } from './document-type-node';
import { createElement, createElementNS, MockBaseElement } from './element';
import { resetEventListeners } from './event';
import { MockElement, MockHTMLElement, MockTextNode, resetElement } from './node';
import { parseHtmlToFragment } from './parse-html';
import { parseDocumentUtil } from './parse-util';
import { MockTreeWalker } from './tree-walker';
import { MockWindow } from './window';

/**
 * Interface for nwsapi instance methods we use.
 */
interface NwsapiInstance {
  configure(config: { LOGERRORS?: boolean; VERBOSITY?: boolean }): void;
  match(selector: string, element: unknown): boolean;
  first(selector: string, context: unknown): unknown | null;
  select(selector: string, context: unknown): unknown[];
  closest(selector: string, element: unknown): unknown | null;
}

export class MockDocument extends MockHTMLElement {
  defaultView: any;
  cookie: string;
  referrer: string;
  /**
   * Returns 'CSS1Compat' for standards mode (the default).
   * Required by nwsapi for quirks mode detection.
   */
  readonly compatMode = 'CSS1Compat';
  /**
   * Returns the MIME type of the document.
   * Required by nwsapi for HTML document detection.
   */
  readonly contentType = 'text/html';
  #nwsapi: NwsapiInstance | null = null;

  constructor(html: string | boolean | null = null, win: any = null) {
    super(null, null);
    this.nodeName = NODE_NAMES.DOCUMENT_NODE;
    this.nodeType = NODE_TYPES.DOCUMENT_NODE;
    this.defaultView = win;
    this.cookie = '';
    this.referrer = '';

    this.appendChild(this.createDocumentTypeNode());

    if (typeof html === 'string') {
      const parsedDoc: MockDocument = parseDocumentUtil(this, html);

      const documentElement = parsedDoc.children.find((elm) => elm.nodeName === 'HTML');
      if (documentElement != null) {
        this.appendChild(documentElement);
        setOwnerDocument(documentElement, this);
      }
    } else if (html !== false) {
      const documentElement = new MockHTMLElement(this, 'html');
      this.appendChild(documentElement);

      documentElement.appendChild(new MockHTMLElement(this, 'head'));
      documentElement.appendChild(new MockHTMLElement(this, 'body'));
    }
  }

  /**
   * Get the nwsapi instance for this document.
   * Lazily creates one if it doesn't exist.
   * Creates a window if the document doesn't have one.
   * @returns the nwsapi instance
   */
  _getDOMSelector(): NwsapiInstance {
    if (!this.#nwsapi) {
      // Ensure we have a window for nwsapi
      if (!this.defaultView) {
        const win = new MockWindow(false);
        (win as { document: unknown }).document = this;
        this.defaultView = win;
      }
      // nwsapi expects a global-like object with document property
      this.#nwsapi = nwsapi({ document: this });
      this.#nwsapi.configure({
        LOGERRORS: false,
        VERBOSITY: false,
      });
    }
    return this.#nwsapi;
  }

  /**
   * Clear the nwsapi cache. Call this when the document structure changes significantly.
   */
  _clearDOMSelector(): void {
    this.#nwsapi = null;
  }

  override get dir() {
    return this.documentElement.dir;
  }
  override set dir(value: string) {
    this.documentElement.dir = value;
  }

  override get localName(): never {
    throw new Error('Unimplemented');
  }

  get location(): Location | null {
    if (this.defaultView != null) {
      return (this.defaultView as Window).location;
    }
    return null;
  }
  set location(val: string) {
    if (this.defaultView != null) {
      (this.defaultView as Window).location.href = val;
    }
  }

  get baseURI() {
    const baseNode = this.head.childNodes.find(
      (node) => node.nodeName === 'BASE',
    ) as MockBaseElement;
    if (baseNode) {
      return baseNode.href;
    }
    return this.URL;
  }

  get URL() {
    return this.location.href;
  }

  get styleSheets() {
    return this.querySelectorAll('style');
  }

  get scripts() {
    return this.querySelectorAll('script');
  }

  get forms() {
    return this.querySelectorAll('form');
  }

  get images() {
    return this.querySelectorAll('img');
  }

  get scrollingElement() {
    return this.documentElement;
  }

  get documentElement() {
    for (let i = this.childNodes.length - 1; i >= 0; i--) {
      if (this.childNodes[i].nodeName === 'HTML') {
        return this.childNodes[i] as MockElement;
      }
    }

    const documentElement = new MockHTMLElement(this, 'html');
    this.appendChild(documentElement);
    return documentElement;
  }
  set documentElement(documentElement) {
    for (let i = this.childNodes.length - 1; i >= 0; i--) {
      if (this.childNodes[i].nodeType !== NODE_TYPES.DOCUMENT_TYPE_NODE) {
        this.childNodes[i].remove();
      }
    }
    if (documentElement != null) {
      this.appendChild(documentElement);
      setOwnerDocument(documentElement, this);
    }
  }

  get head() {
    const documentElement = this.documentElement;
    for (let i = 0; i < documentElement.childNodes.length; i++) {
      if (documentElement.childNodes[i].nodeName === 'HEAD') {
        return documentElement.childNodes[i] as MockElement;
      }
    }

    const head = new MockHTMLElement(this, 'head');
    documentElement.insertBefore(head, documentElement.firstChild);
    return head;
  }
  set head(head) {
    const documentElement = this.documentElement;
    for (let i = documentElement.childNodes.length - 1; i >= 0; i--) {
      if (documentElement.childNodes[i].nodeName === 'HEAD') {
        documentElement.childNodes[i].remove();
      }
    }
    if (head != null) {
      documentElement.insertBefore(head, documentElement.firstChild);
      setOwnerDocument(head, this);
    }
  }

  get body() {
    const documentElement = this.documentElement;
    for (let i = documentElement.childNodes.length - 1; i >= 0; i--) {
      if (documentElement.childNodes[i].nodeName === 'BODY') {
        return documentElement.childNodes[i] as MockElement;
      }
    }

    const body = new MockHTMLElement(this, 'body');
    documentElement.appendChild(body);
    return body;
  }
  set body(body) {
    const documentElement = this.documentElement;
    for (let i = documentElement.childNodes.length - 1; i >= 0; i--) {
      if (documentElement.childNodes[i].nodeName === 'BODY') {
        documentElement.childNodes[i].remove();
      }
    }
    if (body != null) {
      documentElement.appendChild(body);
      setOwnerDocument(body, this);
    }
  }

  override appendChild(newNode: MockElement) {
    newNode.remove();
    newNode.parentNode = this;
    this.childNodes.push(newNode);
    return newNode;
  }

  createComment(data: string) {
    return new MockComment(this, data);
  }

  createAttribute(attrName: string) {
    return new MockAttr(attrName.toLowerCase(), '');
  }

  createAttributeNS(namespaceURI: string, attrName: string) {
    return new MockAttr(attrName, '', namespaceURI);
  }

  createElement(tagName: string) {
    if (tagName === NODE_NAMES.DOCUMENT_NODE) {
      const doc = new MockDocument(false as any);
      doc.nodeName = tagName;
      doc.parentNode = null;
      return doc;
    }

    return createElement(this, tagName);
  }

  createElementNS(namespaceURI: string, tagName: string) {
    const elmNs = createElementNS(this, namespaceURI, tagName);
    return elmNs;
  }

  createTextNode(text: string) {
    return new MockTextNode(this, text);
  }

  createDocumentFragment() {
    return new MockDocumentFragment(this);
  }

  createDocumentTypeNode() {
    return new MockDocumentTypeNode(this);
  }

  /**
   * Creates a TreeWalker for traversing the document tree.
   * This is a simplified implementation for dom-selector compatibility.
   * @param root - the root node for the tree walker
   * @param whatToShow - a bitmask specifying which nodes to show
   * @param filter - an optional node filter
   * @returns a new TreeWalker instance
   */
  createTreeWalker(
    root: MockElement,
    whatToShow = 0xffffffff,
    filter: NodeFilter | null = null,
  ): TreeWalker {
    return new MockTreeWalker(root, whatToShow, filter);
  }

  getElementById(id: string) {
    return getElementById(this, id);
  }

  getElementsByName(elmName: string) {
    return getElementsByName(this, elmName.toLowerCase());
  }

  override get title() {
    const title = this.head.childNodes.find((elm) => elm.nodeName === 'TITLE') as MockElement;
    if (title != null && typeof title.textContent === 'string') {
      return title.textContent.trim();
    }
    return '';
  }
  override set title(value: string) {
    const head = this.head;
    let title = head.childNodes.find((elm) => elm.nodeName === 'TITLE') as MockElement;
    if (title == null) {
      title = this.createElement('title');
      head.appendChild(title);
    }
    title.textContent = value;
  }
}

export function createDocument(html: string | boolean | null = null): Document {
  return new MockWindow(html).document;
}

export function createFragment(html?: string): DocumentFragment {
  return parseHtmlToFragment(html ?? '', null);
}

export function resetDocument(doc: Document) {
  if (doc != null) {
    resetEventListeners(doc);

    const documentElement = doc.documentElement;
    if (documentElement != null) {
      resetElement(documentElement as any);

      for (let i = 0, ii = documentElement.childNodes.length; i < ii; i++) {
        const childNode = documentElement.childNodes[i];
        resetElement(childNode as any);
        (childNode.childNodes as any).length = 0;
      }
    }

    for (const key in doc) {
      if (doc.hasOwnProperty(key) && !DOC_KEY_KEEPERS.has(key)) {
        delete (doc as any)[key];
      }
    }

    try {
      (doc as any).nodeName = NODE_NAMES.DOCUMENT_NODE;
    } catch {}
    try {
      (doc as any).nodeType = NODE_TYPES.DOCUMENT_NODE;
    } catch {}
    try {
      (doc as any).cookie = '';
    } catch {}
    try {
      (doc as any).referrer = '';
    } catch {}
  }
}

const DOC_KEY_KEEPERS = new Set([
  'nodeName',
  'nodeType',
  'nodeValue',
  'ownerDocument',
  'parentNode',
  'childNodes',
  '_childNodes',
  '_shadowRoot',
  'compatMode',
  'contentType',
]);

export function getElementById(elm: MockElement, id: string): MockElement | null {
  const children = elm.children;
  for (let i = 0, ii = children.length; i < ii; i++) {
    const childElm = children[i];
    if (childElm.id === id) {
      return childElm;
    }
    const childElmFound = getElementById(childElm, id);
    if (childElmFound != null) {
      return childElmFound;
    }
  }
  return null;
}

function getElementsByName(elm: MockElement, elmName: string, foundElms: MockElement[] = []) {
  const children = elm.children;
  for (let i = 0, ii = children.length; i < ii; i++) {
    const childElm = children[i];
    if ((childElm as any).name && (childElm as any).name.toLowerCase() === elmName) {
      foundElms.push(childElm);
    }
    getElementsByName(childElm, elmName, foundElms);
  }
  return foundElms;
}

function setOwnerDocument(elm: MockElement, ownerDocument: any) {
  for (let i = 0, ii = elm.childNodes.length; i < ii; i++) {
    elm.childNodes[i].ownerDocument = ownerDocument;

    if (elm.childNodes[i].nodeType === NODE_TYPES.ELEMENT_NODE) {
      setOwnerDocument(elm.childNodes[i] as any, ownerDocument);
    }
  }
}
