import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot array top', () => {
  it('renders slotted content in the right position', async () => {
    const { root } = await render(
      <slot-array-top>
        <p>Slotted content should be on bottom</p>
      </slot-array-top>,
    );

    await waitForExist('slot-array-top.hydrated');
    const innerContent = root.shadowRoot.querySelector('span')!.textContent!.trim();
    const slottedContent = root.textContent!.trim();

    expect(innerContent).toBe('Content should be on top');
    expect(slottedContent).toBe('Slotted content should be on bottom');
    expect(document.querySelector('[hidden]')).toBeNull();
  });
});
