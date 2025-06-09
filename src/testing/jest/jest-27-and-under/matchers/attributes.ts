import { NODE_TYPES } from '@stencil/core/mock-doc';

export function toEqualAttribute(elm: HTMLElement, expectAttrName: string, expectAttrValue: string) {
  if (!elm) {
    throw new Error(`expect toMatchAttribute value is null`);
  }

  if (typeof (elm as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  if (elm.nodeType !== NODE_TYPES.ELEMENT_NODE) {
    throw new Error(`expect toMatchAttribute value is not an element`);
  }

  let receivedAttrValue = elm.getAttribute(expectAttrName);

  if (expectAttrValue != null) {
    expectAttrValue = String(expectAttrValue);
  }

  if (receivedAttrValue != null) {
    receivedAttrValue = String(receivedAttrValue);
  }

  const pass = expectAttrValue === receivedAttrValue;

  return {
    message: () =>
      `expected attribute ${expectAttrName} "${expectAttrValue}" to ${pass ? 'not ' : ''}equal "${receivedAttrValue}"`,
    pass: pass,
  };
}

export function toEqualAttributes(elm: HTMLElement, expectAttrs: { [attrName: string]: any }) {
  if (!elm) {
    throw new Error(`expect toEqualAttributes value is null`);
  }

  if (typeof (elm as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  if (elm.nodeType !== NODE_TYPES.ELEMENT_NODE) {
    throw new Error(`expect toEqualAttributes value is not an element`);
  }

  const attrNames = Object.keys(expectAttrs);

  const pass = attrNames.every((attrName) => {
    let expectAttrValue = expectAttrs[attrName];
    if (expectAttrValue != null) {
      expectAttrValue = String(expectAttrValue);
    }
    return elm.getAttribute(attrName) === expectAttrValue;
  });

  return {
    message: () =>
      `expected attributes to ${pass ? 'not ' : ''}equal ${attrNames
        .map((a) => `[${a}="${expectAttrs[a]}"]`)
        .join(', ')}`,
    pass: pass,
  };
}

export function toHaveAttribute(elm: HTMLElement, expectAttrName: string) {
  if (!elm) {
    throw new Error(`expect toHaveAttribute value is null`);
  }

  if (typeof (elm as any).then === 'function') {
    throw new Error(`element must be a resolved value, not a promise, before it can be tested`);
  }

  if (elm.nodeType !== NODE_TYPES.ELEMENT_NODE) {
    throw new Error(`expect toHaveAttribute value is not an element`);
  }

  const pass = elm.hasAttribute(expectAttrName);

  return {
    message: () => `expected to ${pass ? 'not ' : ''}have the attribute "${expectAttrName}"`,
    pass: pass,
  };
}
