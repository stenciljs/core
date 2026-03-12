import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot array top', () => {
  it('renders slotted content in the right position', async () => {
    await render(
      <slot-array-top>
        <p>Slotted content should be on bottom</p>
      </slot-array-top>,
    );

    const root = document.querySelector('slot-array-top')!;
    expect(root.textContent).toBe('Content should be on topSlotted content should be on bottom');
    expect(document.querySelector('[hidden]')).toBeNull();
  });
});
