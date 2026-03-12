import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-slot-text-with-sibling', () => {
  it('sets the textContent in the slot location', async () => {
    await render(<cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>);

    const cmpLabel = document.querySelector('cmp-label-with-slot-sibling')!;
    cmpLabel.textContent = 'New text to go in the slot';
    expect(cmpLabel.textContent.trim()).toBe('New text to go in the slot');
  });

  it("doesn't override all children when assigning textContent", async () => {
    await render(<cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>);

    const cmpLabel = document.querySelector('cmp-label-with-slot-sibling')!;
    cmpLabel.textContent = "New text that we want to go in a slot, but don't care about for this test";
    const divElement = cmpLabel.querySelector('div')!;
    expect(divElement.textContent).toBe('Non-slotted text');
  });

  it('leaves the structure of the label intact', async () => {
    await render(<cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>);

    const cmpLabel = document.querySelector('cmp-label-with-slot-sibling')!;
    cmpLabel.textContent = 'New text for label structure testing';
    const label = cmpLabel.querySelector('label')!;

    /**
     * Expect three child nodes in the label
     * - a content reference text node
     * - the slotted text node
     * - the non-slotted text
     */
    expect(label).toBeTruthy();
    expect(label.childNodes.length).toBe(3);
    expect((label.childNodes[0] as any)['s-cr']).toBeDefined();
    expect(label.childNodes[1].textContent).toBe('New text for label structure testing');
    expect(label.childNodes[2].textContent).toBe('Non-slotted text');
  });
});
