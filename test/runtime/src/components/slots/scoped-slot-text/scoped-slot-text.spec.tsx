import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-text', () => {
  it('sets the textContent in the slot location', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    root.textContent = 'New text to go in the slot';
    expect(root.textContent.trim()).toBe('New text to go in the slot');
  });

  it('leaves the structure of the label intact', async () => {
    const { root } = await render(<cmp-label>This text should go in a slot</cmp-label>);
    await waitForExist('cmp-label.hydrated');

    root.textContent = 'New text for label structure testing';
    const label = root.querySelector('label')!;

    /**
     * Expect one child node in the label: the <slot> element.
     * Slotted text now lives physically inside <slot>.
     */
    expect(label).toBeTruthy();
    expect(label.childNodes.length).toBe(1);
    expect((label.childNodes[0] as any)['s-cr']).toBeDefined();
    expect(label.childNodes[0].textContent).toBe('New text for label structure testing');
  });
});
