import { render, describe, it, expect, h, vi } from '@stencil/vitest';

describe('referenceTarget', () => {
  it('passes referenceTarget to attachShadow', async () => {
    const spy = vi.spyOn(Element.prototype, 'attachShadow');
    try {
      await render(<reference-target-cmp />);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ referenceTarget: 'inner-input' }));
    } finally {
      spy.mockRestore();
    }
  });

  it.runIf('referenceTarget' in ShadowRoot.prototype)(
    'resolves an external label to the internal element',
    async () => {
      const { root } = await render(
        <div>
          <label htmlFor='ref-host'>Name</label>
          <reference-target-cmp id='ref-host' />
        </div>,
      );
      const host = root.querySelector('reference-target-cmp')!;
      const input = host.shadowRoot!.querySelector('input')!;

      expect(Reflect.get(host.shadowRoot!, 'referenceTarget')).toBe('inner-input');
      expect(input.labels?.length).toBe(1);
    },
  );
});
