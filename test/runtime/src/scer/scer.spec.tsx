import { describe, it, expect, afterEach } from '@stencil/vitest';
import { render } from '@stencil/vitest';

import { scerRegistry } from './test-registry';

describe('SCER', () => {
  it('defines components in scoped registry, not global customElements', async () => {
    // for the standalone loader, nothing is initialized until the element is found in the DOM
    await render(`<shadow-dom-basic />`, { registry: scerRegistry });
    expect(scerRegistry.get('shadow-dom-basic')).toBeDefined();
    expect(customElements.get('shadow-dom-basic')).toBeUndefined();
  });

  it('defines light-DOM components in scoped registry, not global', async () => {
    // for the standalone loader, nothing is initialized until the element is found in the DOM
    await render(`<element-cmp />`, { registry: scerRegistry });
    expect(scerRegistry.get('element-cmp')).toBeDefined();
    expect(customElements.get('element-cmp')).toBeUndefined();
  });

  it('renders a shadow component via scoped registry', async () => {
    const { root } = await render(`<shadow-dom-basic />`, { registry: scerRegistry });
    expect(root.tagName.toLowerCase()).toBe('shadow-dom-basic');
    expect(root.classList.contains('hydrated')).toBe(true);
    expect(root.shadowRoot).not.toBeNull();
  });

  it('shadow root is associated with the scoped registry', async () => {
    const { root } = await render(`<shadow-dom-basic />`, { registry: scerRegistry });
    expect((root.shadowRoot as any).customElementRegistry).toBe(scerRegistry);
  });

  it('renders a scoped-encapsulation component via scoped registry', async () => {
    const { root } = await render(`<scoped-basic />`, { registry: scerRegistry });
    expect(root.tagName.toLowerCase()).toBe('scoped-basic');
    expect(root.classList.contains('hydrated')).toBe(true);
  });

  it('elements appended to the initialized subtree upgrade from scoped registry', async () => {
    const el = document.createElement('element-cmp', {
      customElementRegistry: scerRegistry,
    }) as any & {
      componentOnReady?: () => Promise<void>;
    };
    el.setAttribute('data-scer-test', '');
    document.body.appendChild(el);
    await scerRegistry.whenDefined('element-cmp');
    await el.componentOnReady?.();
    expect(el.classList.contains('hydrated')).toBe(true);
  });
});
