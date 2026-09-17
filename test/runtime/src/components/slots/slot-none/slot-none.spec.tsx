import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-none', () => {
  it('should not apply slot fixes if there are no slots', async () => {
    const { root } = await render(
      <slot-none>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </slot-none>,
    );
    await waitForExist('slot-none.hydrated');

    const slotNone = root;
    expect(slotNone.children).toHaveLength(3);
    expect(slotNone.children[0].tagName).toBe('LI');
    expect(slotNone.childNodes.length).toBe(3);
    expect((slotNone.childNodes[2] as HTMLElement).tagName).toBe('LI');
    expect((slotNone as any).__children).toBeFalsy();
    expect((slotNone as any).__childNodes).toBeFalsy();
  });
});
