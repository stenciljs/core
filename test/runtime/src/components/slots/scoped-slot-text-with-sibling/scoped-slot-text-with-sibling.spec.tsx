import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-text-with-sibling', () => {
  it('sets the textContent in the slot location', async () => {
    const { root } = await render(
      <cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>,
    );
    await waitForExist('cmp-label-with-slot-sibling.hydrated');
    root.textContent = 'New text to go in the slot';
    expect(root.textContent.trim()).toBe('New text to go in the slot');
  });

  it("doesn't override all children when assigning textContent", async () => {
    const { root } = await render(
      <cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>,
    );
    await waitForExist('cmp-label-with-slot-sibling.hydrated');
    root.textContent = "New text that we want to go in a slot, but don't care about for this test";
    const divElement = root.querySelector('div')!;
    expect(divElement.textContent).toBe('Non-slotted text');
  });

  it('leaves the structure of the label intact', async () => {
    const { root } = await render(
      <cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>,
    );
    await waitForExist('cmp-label-with-slot-sibling.hydrated');
    root.textContent = 'New text for label structure testing';
    const label = root.querySelector('label')!;
    /**
     * Expect two child nodes in the label:
     * - the <slot> element (contains slotted text)
     * - the non-slotted <div>
     */
    expect(label).toBeTruthy();
    expect(label.childNodes.length).toBe(2);
    expect((label.childNodes[0] as any)['s-cr']).toBeDefined();
    expect(label.childNodes[0].textContent).toBe('New text for label structure testing');
    expect(label.childNodes[1].textContent).toBe('Non-slotted text');
  });
});
