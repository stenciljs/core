import { describe, it, expect } from '@stencil/vitest';

type BooleanStringElement = HTMLElement & {
  bool: boolean;
  union: boolean | string;
  componentOnReady?(): Promise<unknown>;
};

const ready = async (el: BooleanStringElement) => {
  if (el.componentOnReady) return el.componentOnReady();
  await customElements.whenDefined(el.localName);
  await new Promise((r) => setTimeout(r, 50));
};

describe('attribute-boolean-string', () => {
  it('sets boolean and boolean|string props from empty attributes present on connect', async () => {
    const el = document.createElement('attribute-boolean-string') as BooleanStringElement;
    el.setAttribute('bool', '');
    el.setAttribute('union', '');
    document.body.appendChild(el);
    await ready(el);

    expect(el.bool).toBe(true);
    expect(el.union).toBe('');
    el.remove();
  });

  it('sets a boolean|string prop when an empty attribute is added after load', async () => {
    const el = document.createElement('attribute-boolean-string') as BooleanStringElement;
    document.body.appendChild(el);
    await ready(el);
    expect(el.union).toBe(false);

    el.setAttribute('union', '');

    expect(el.union).toBe('');
    el.remove();
  });
});
