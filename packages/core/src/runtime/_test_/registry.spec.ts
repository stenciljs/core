import { afterEach, describe, expect, it } from '@stencil/vitest';

import { getRegistry, setRegistry } from '../registry';

describe('getRegistry', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'customElements');

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'customElements', original);
    setRegistry(undefined as unknown as CustomElementRegistry);
  });

  it('returns undefined without throwing when there is no customElements global', () => {
    // e.g. a server render (Next.js) importing a standalone component module
    delete (globalThis as { customElements?: unknown }).customElements;
    expect(() => getRegistry()).not.toThrow();
    expect(getRegistry()).toBeUndefined();
  });

  it('prefers a registry set with setRegistry()', () => {
    const registry = {} as CustomElementRegistry;
    setRegistry(registry);
    expect(getRegistry()).toBe(registry);
  });
});
