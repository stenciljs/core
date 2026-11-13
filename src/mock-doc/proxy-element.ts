/**
 * Mock-doc wraps elements of unregistered custom elements in a proxy
 * (`createElement('my-tag')` returns the proxy, not the wrapped mock element).
 * These maps keep the pairing, so code that walks the DOM (raw elements) can
 * resolve the object user code holds (the proxy) for identity comparisons.
 */

const proxyElements = new WeakMap<object, any>();
const proxiedElements = new WeakMap<any, object>();

export const setProxyElement = (proxy: object, elm: any): void => {
  proxyElements.set(proxy, elm);
  proxiedElements.set(elm, proxy);
};

/**
 * Re-points an existing proxy wrapper at a new mock element, e.g. when a lazily
 * defined custom element upgrades the element the proxy forwards to.
 * @param proxy the proxy wrapper
 * @param elm the mock element the proxy forwards to
 * @param previousElm the mock element the proxy previously forwarded to
 */
export const resetProxyElement = (proxy: object, elm: any, previousElm: any): void => {
  if (previousElm != null) {
    proxiedElements.delete(previousElm);
  }
  setProxyElement(proxy, elm);
};

/**
 * Returns the proxy wrapper for a mock element, or null when the element is not
 * wrapped.
 * @param elm the mock element to resolve
 * @returns the proxy wrapper for the element, or null
 */
export const getProxyElement = (elm: any): object | null => {
  return proxiedElements.get(elm) ?? null;
};

export const hasProxyElement = (proxy: object): boolean => {
  return proxyElements.has(proxy);
};

export const getProxyTarget = (proxy: object): any | undefined => {
  return proxyElements.get(proxy);
};
