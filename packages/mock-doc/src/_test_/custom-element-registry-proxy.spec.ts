import { describe, it, expect } from '@stencil/vitest';

import { createWindow } from '../window';

describe('createCustomElement proxy', () => {
  it('supports Object.defineProperty (e.g. vi.spyOn/jest.spyOn)', () => {
    const win = createWindow() as any;
    const elm = win.document.createElement('x-unregistered');
    elm.someMethod = () => 'original';

    // vi.spyOn/jest.spyOn both work by calling Object.defineProperty() on the
    // target. Without a `defineProperty` trap, that write falls back to the
    // engine's default behavior against the Proxy's own (empty) target
    // object, silently bypassing the `get`/`set` traps that route ordinary
    // property access to the real underlying element - so the redefined
    // property would never be visible through the proxy again.
    Object.defineProperty(elm, 'someMethod', {
      value: () => 'spied',
      writable: true,
      configurable: true,
    });

    expect(elm.someMethod()).toBe('spied');
  });

  it('reflects Object.keys() and getOwnPropertyDescriptor() from the real element, not the empty proxy target', () => {
    const win = createWindow() as any;
    const elm = win.document.createElement('x-unregistered');
    elm.customProp = 'hello';

    expect(Object.keys(elm)).toContain('customProp');
    expect(Object.getOwnPropertyDescriptor(elm, 'customProp')?.value).toBe('hello');
  });

  it('supports delete on a property added through the proxy', () => {
    const win = createWindow() as any;
    const elm = win.document.createElement('x-unregistered');
    elm.customProp = 'hello';
    expect('customProp' in elm).toBe(true);

    delete elm.customProp;
    expect('customProp' in elm).toBe(false);
  });

  describe('sibling traversal identity', () => {
    it('nextElementSibling finds a real sibling on an unregistered custom element', () => {
      const win = createWindow() as any;
      const doc = win.document;
      const parent = doc.createElement('x-parent');
      const first = doc.createElement('x-child');
      const second = doc.createElement('x-child');
      parent.appendChild(first);
      parent.appendChild(second);

      expect(first.nextElementSibling).toBe(second);
      expect(second.previousElementSibling).toBe(first);
    });

    it('nextSibling finds a real sibling on an unregistered custom element', () => {
      const win = createWindow() as any;
      const doc = win.document;
      const parent = doc.createElement('x-parent');
      const first = doc.createElement('x-child');
      const second = doc.createElement('x-child');
      parent.appendChild(first);
      parent.appendChild(second);

      expect(first.nextSibling).toBe(second);
    });

    it('holds across many siblings, matching a real wheel-picker-sized tree', () => {
      const win = createWindow() as any;
      const doc = win.document;
      const column = doc.createElement('x-column');
      const options = Array.from({ length: 60 }, (_, i) => {
        const opt = doc.createElement('x-option');
        opt.textContent = String(i);
        column.appendChild(opt);
        return opt;
      });

      for (let i = 0; i < options.length - 1; i++) {
        expect(options[i].nextElementSibling).toBe(options[i + 1]);
      }
      expect(options[options.length - 1].nextElementSibling).toBe(null);
    });

    it('lets querySelector find an id-bearing element that follows a large sibling subtree', () => {
      const win = createWindow() as any;
      const doc = win.document;
      const host = doc.createElement('x-host');
      const shadowRoot = host.attachShadow({ mode: 'open' });

      const wheel = doc.createElement('x-wheel');
      for (let c = 0; c < 4; c++) {
        const column = doc.createElement('x-column');
        wheel.appendChild(column);
        for (let o = 0; o < 60; o++) {
          const opt = doc.createElement('x-option');
          opt.textContent = String(o);
          column.appendChild(opt);
        }
      }
      shadowRoot.appendChild(wheel);

      const target = doc.createElement('x-confirm-button');
      target.id = 'confirm-button';
      shadowRoot.appendChild(target);

      expect(shadowRoot.querySelector('#confirm-button')).toBe(target);
    });
  });
});
