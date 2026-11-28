import { XLINK_NS } from './constants';

const attrHandler = {
  get(obj: any, prop: string | symbol) {
    // a direct read is cheaper than `in` (a prototype walk) for the common, non-index case
    const value = obj[prop];
    if (value !== undefined || typeof prop === 'symbol') {
      return value;
    }
    if (!isNaN(prop as any)) {
      return (obj as MockAttributeMap).__items[prop as any];
    }
    return undefined;
  },
};

export const createAttributeProxy = (caseInsensitive: boolean) =>
  new Proxy(new MockAttributeMap(caseInsensitive), attrHandler);

export class MockAttributeMap {
  __items: MockAttr[] = [];

  constructor(public caseInsensitive = false) {}

  get length() {
    return this.__items.length;
  }

  item(index: number) {
    return this.__items[index] || null;
  }

  setNamedItem(attr: MockAttr) {
    attr.namespaceURI = null;
    this.setNamedItemNS(attr);
  }

  setNamedItemNS(attr: MockAttr) {
    if (attr != null && attr.value != null) {
      attr.value = String(attr.value);
    }

    const items = this.__items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].localName === attr.localName && items[i].namespaceURI === attr.namespaceURI) {
        items[i].value = attr.value;
        return;
      }
    }
    items.push(attr);
  }

  getNamedItem(attrName: string) {
    if (this.caseInsensitive) {
      attrName = attrName.toLowerCase();
    }
    return this.getNamedItemNS(null, attrName);
  }

  getNamedItemNS(namespaceURI: string | null, attrName: string) {
    namespaceURI = getNamespaceURI(namespaceURI);
    const items = this.__items;
    for (let i = 0; i < items.length; i++) {
      const attr = items[i];
      if (attr.localName === attrName && getNamespaceURI(attr.namespaceURI) === namespaceURI) {
        return attr;
      }
    }
    return null;
  }

  removeNamedItem(attr: MockAttr) {
    this.removeNamedItemNS(attr);
  }

  removeNamedItemNS(attr: MockAttr) {
    const items = this.__items;
    for (let i = 0, ii = items.length; i < ii; i++) {
      if (items[i].localName === attr.localName && items[i].namespaceURI === attr.namespaceURI) {
        items.splice(i, 1);
        break;
      }
    }
  }

  [Symbol.iterator]() {
    let i = 0;

    return {
      next: () => ({
        done: i === this.length,
        value: this.item(i++),
      }),
    };
  }

  get [Symbol.toStringTag]() {
    return 'MockAttributeMap';
  }
}

function getNamespaceURI(namespaceURI: string | null) {
  return namespaceURI === XLINK_NS ? null : namespaceURI;
}

export function cloneAttributes(srcAttrs: MockAttributeMap, sortByName = false) {
  // Use createAttributeProxy to ensure numeric indexing works (e.g., attrs[0])
  const dstAttrs = createAttributeProxy(srcAttrs.caseInsensitive);
  if (srcAttrs != null) {
    const attrLen = srcAttrs.length;

    if (sortByName && attrLen > 1) {
      const sortedAttrs: MockAttr[] = [];
      for (let i = 0; i < attrLen; i++) {
        const srcAttr = srcAttrs.item(i);
        const dstAttr = new MockAttr(
          srcAttr.localName,
          srcAttr.value,
          srcAttr.namespaceURI,
          srcAttr.prefix,
        );
        sortedAttrs.push(dstAttr);
      }

      sortedAttrs.sort(sortAttributes).forEach((attr) => {
        dstAttrs.setNamedItemNS(attr);
      });
    } else {
      for (let i = 0; i < attrLen; i++) {
        const srcAttr = srcAttrs.item(i);
        const dstAttr = new MockAttr(
          srcAttr.localName,
          srcAttr.value,
          srcAttr.namespaceURI,
          srcAttr.prefix,
        );
        dstAttrs.setNamedItemNS(dstAttr);
      }
    }
  }
  return dstAttrs;
}

function sortAttributes(a: MockAttr, b: MockAttr) {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
}

export class MockAttr {
  private _localName: string;
  private _prefix: string | null;
  private _value: string;
  private _namespaceURI: string | null;

  constructor(
    attrName: string,
    attrValue: string,
    namespaceURI: string | null = null,
    prefix: string | null = null,
  ) {
    // If prefix provided, use it directly with localName = attrName
    // Otherwise, parse prefix from attrName if it contains ':'
    if (prefix != null) {
      this._prefix = prefix;
      this._localName = attrName;
    } else if (attrName.includes(':')) {
      const [parsedPrefix, ...rest] = attrName.split(':');
      this._prefix = parsedPrefix;
      this._localName = rest.join(':');
    } else {
      this._prefix = null;
      this._localName = attrName;
    }
    this._value = String(attrValue);
    this._namespaceURI = namespaceURI;
  }

  get name() {
    return this._prefix != null ? `${this._prefix}:${this._localName}` : this._localName;
  }
  set name(value) {
    if (value.includes(':')) {
      const [prefix, ...rest] = value.split(':');
      this._prefix = prefix;
      this._localName = rest.join(':');
    } else {
      this._prefix = null;
      this._localName = value;
    }
  }

  get localName() {
    return this._localName;
  }
  set localName(value) {
    this._localName = value;
  }

  get prefix() {
    return this._prefix;
  }
  set prefix(value) {
    this._prefix = value;
  }

  get value() {
    return this._value;
  }
  set value(value) {
    this._value = String(value);
  }

  get nodeName() {
    return this.name;
  }
  set nodeName(value) {
    this.name = value;
  }

  get nodeValue() {
    return this._value;
  }
  set nodeValue(value) {
    this._value = String(value);
  }

  get namespaceURI() {
    return this._namespaceURI;
  }
  set namespaceURI(namespaceURI) {
    this._namespaceURI = namespaceURI;
  }
}
