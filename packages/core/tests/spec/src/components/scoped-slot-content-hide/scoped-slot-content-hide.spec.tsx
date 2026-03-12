import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-slot-content-hide', () => {
  it('can toggle content visibility according to the presence of a slot', async () => {
    const { waitForChanges } = await render(
      <scoped-slot-content-hide use-slot={false}>
        testing
        <div class="inside-slot">inside slot</div>
      </scoped-slot-content-hide>,
    );

    const root = document.querySelector('scoped-slot-content-hide') as any;
    const slottedDiv = root.querySelector('.inside-slot') as HTMLElement;

    // Initially useSlot is false, so content should be hidden
    expect(root.textContent).not.toContain('testing');
    expect(slottedDiv).toBeDefined();
    expect(slottedDiv.hidden).toBe(true);

    // Enable the slot
    root.useSlot = true;
    await waitForChanges();

    expect(root.textContent).toContain('testing');
    expect(slottedDiv.hidden).toBe(false);

    // Disable the slot again
    root.useSlot = false;
    await waitForChanges();

    expect(root.textContent).not.toContain('testing');
    expect(slottedDiv.hidden).toBe(true);

    // Enable the slot again
    root.useSlot = true;
    await waitForChanges();

    expect(root.textContent).toContain('testing');
    expect(slottedDiv.hidden).toBe(false);
  });
});
