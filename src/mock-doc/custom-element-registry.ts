import { NODE_TYPES } from './constants';
import { MockHTMLElement, MockNode } from './node';

export class MockCustomElementRegistry implements CustomElementRegistry {
  private __registry: Map<string, { cstr: any; options: any }>;
  private __whenDefined: Map<string, Function[]>;

  constructor(private win: Window) {}

  define(tagName: string, cstr: any, options?: any) {
    if (tagName.toLowerCase() !== tagName) {
      throw new Error(
        `Failed to execute 'define' on 'CustomElementRegistry': "${tagName}" is not a valid custom element name`,
      );
    }

    if (this.__registry == null) {
      this.__registry = new Map();
    }
    this.__registry.set(tagName, { cstr, options });

    if (this.__whenDefined != null) {
      const whenDefinedResolveFns = this.__whenDefined.get(tagName);
      if (whenDefinedResolveFns != null) {
        whenDefinedResolveFns.forEach((whenDefinedResolveFn) => {
          whenDefinedResolveFn();
        });
        whenDefinedResolveFns.length = 0;
        this.__whenDefined.delete(tagName);
      }
    }

    const doc = this.win.document;
    if (doc != null) {
      const hosts = doc.querySelectorAll(tagName);
      hosts.forEach((host) => {
        if (upgradedElements.has(host) === false) {
          tempDisableCallbacks.add(doc);

          const upgradedCmp = createCustomElement(this, doc, tagName) as MockNode;

          for (let i = 0; i < host.childNodes.length; i++) {
            const childNode = host.childNodes[i];
            childNode.remove();
            upgradedCmp.appendChild(childNode as any);
          }

          tempDisableCallbacks.delete(doc);

          if (proxyElements.has(host)) {
            proxyElements.set(host, upgradedCmp);
          }
        }

        fireConnectedCallback(host);
      });
    }
  }

  get(tagName: string) {
    if (this.__registry != null) {
      const def = this.__registry.get(tagName.toLowerCase());
      if (def != null) {
        return def.cstr;
      }
    }
    return undefined;
  }

  getName(cstr: CustomElementConstructor) {
    for (const [tagName, def] of this.__registry.entries()) {
      if (def.cstr === cstr) {
        return tagName;
      }
    }
    return undefined;
  }

  upgrade(_rootNode: any) {
    //
  }

  clear() {
    if (this.__registry != null) {
      this.__registry.clear();
    }

    if (this.__whenDefined != null) {
      this.__whenDefined.clear();
    }
  }

  whenDefined(tagName: string): Promise<CustomElementConstructor> {
    tagName = tagName.toLowerCase();

    if (this.__registry != null && this.__registry.has(tagName) === true) {
      return Promise.resolve<CustomElementConstructor>(this.__registry.get(tagName).cstr);
    }

    return new Promise<CustomElementConstructor>((resolve) => {
      if (this.__whenDefined == null) {
        this.__whenDefined = new Map();
      }

      let whenDefinedResolveFns = this.__whenDefined.get(tagName);
      if (whenDefinedResolveFns == null) {
        whenDefinedResolveFns = [];
        this.__whenDefined.set(tagName, whenDefinedResolveFns);
      }

      whenDefinedResolveFns.push(resolve);
    });
  }
}

export function createCustomElement(customElements: MockCustomElementRegistry, ownerDocument: any, tagName: string) {
  const Cstr = customElements.get(tagName);

  if (Cstr != null) {
    const cmp = new Cstr(ownerDocument);
    cmp.nodeName = tagName.toUpperCase();
    upgradedElements.add(cmp);
    return cmp;
  }

  const host = new Proxy(
    {},
    {
      get(obj: any, prop: string) {
        const elm = proxyElements.get(host);
        if (elm != null) {
          return elm[prop];
        }
        return obj[prop];
      },
      set(obj: any, prop: string, val: any) {
        const elm = proxyElements.get(host);
        if (elm != null) {
          elm[prop] = val;
        } else {
          obj[prop] = val;
        }
        return true;
      },
      has(obj: any, prop: string) {
        const elm = proxyElements.get(host);
        if (prop in elm) {
          return true;
        }
        if (prop in obj) {
          return true;
        }
        return false;
      },
    },
  );

  const elm = new MockHTMLElement(ownerDocument, tagName);

  proxyElements.set(host, elm);

  return host;
}

const proxyElements = new WeakMap();

const upgradedElements = new WeakSet();

export function connectNode(ownerDocument: any, node: MockNode) {
  node.ownerDocument = ownerDocument;

  if (node.nodeType === NODE_TYPES.ELEMENT_NODE) {
    if (ownerDocument != null && node.nodeName.includes('-')) {
      const win = ownerDocument.defaultView as Window;
      if (win != null && typeof (node as any).connectedCallback === 'function' && node.isConnected) {
        fireConnectedCallback(node);
      }

      const shadowRoot = (node as any as Element).shadowRoot;
      if (shadowRoot != null) {
        shadowRoot.childNodes.forEach((childNode) => {
          connectNode(ownerDocument, childNode as any);
        });
      }
    }

    node.childNodes.forEach((childNode) => {
      connectNode(ownerDocument, childNode);
    });
  } else {
    node.childNodes.forEach((childNode) => {
      childNode.ownerDocument = ownerDocument;
    });
  }
}

function fireConnectedCallback(node: any) {
  if (typeof (node as any).connectedCallback === 'function') {
    if (tempDisableCallbacks.has(node.ownerDocument) === false) {
      try {
        node.connectedCallback();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export function disconnectNode(node: MockNode) {
  if (node.nodeType === NODE_TYPES.ELEMENT_NODE) {
    if (node.nodeName.includes('-') === true && typeof (node as any).disconnectedCallback === 'function') {
      if (tempDisableCallbacks.has(node.ownerDocument) === false) {
        try {
          (node as any).disconnectedCallback();
        } catch (e) {
          console.error(e);
        }
      }
    }
    node.childNodes.forEach(disconnectNode);
  }
}

export function attributeChanged(node: MockNode, attrName: string, oldValue: string | null, newValue: string | null) {
  attrName = attrName.toLowerCase();

  const observedAttributes = (node as any).constructor.observedAttributes as string[];
  if (
    Array.isArray(observedAttributes) === true &&
    observedAttributes.some((obs) => obs.toLowerCase() === attrName) === true
  ) {
    try {
      (node as any).attributeChangedCallback(attrName, oldValue, newValue);
    } catch (e) {
      console.error(e);
    }
  }
}

export function checkAttributeChanged(node: MockNode) {
  return node.nodeName.includes('-') === true && typeof (node as any).attributeChangedCallback === 'function';
}

const tempDisableCallbacks = new Set();
