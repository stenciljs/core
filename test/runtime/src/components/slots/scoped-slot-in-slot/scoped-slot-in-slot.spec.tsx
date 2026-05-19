import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-in-slot', () => {
  it('correctly renders content slotted through multiple levels of nested slots', async () => {
    const { root } = await render(
      <ion-host>
        <span slot='label'>Label text</span>
        <span slot='suffix'>Suffix text</span>
        <span slot='message'>Message text</span>
      </ion-host>,
    );
    await waitForExist('ion-host.hydrated');
    const host = root;
    expect(host).toBeDefined();

    // Check the parent content
    const parent = host.querySelector('ion-parent')!;
    expect(parent.firstElementChild!.tagName).toBe('LABEL');

    // Ensure the label slot content made it through
    const span = parent.querySelector('label span[slot="label"]')!;
    expect(span).toBeDefined();
    expect(span.tagName).toBe('SPAN');
    expect(span.textContent).toBe('Label text');

    // Ensure the message slot content made it through (slot[name=message] is lastElementChild)
    expect(parent.lastElementChild!.tagName).toBe('SLOT');
    expect(parent.lastElementChild!.textContent).toBe('Message text');

    // Check the child content
    const child = parent.querySelector('ion-child')!;
    expect(child).toBeDefined();

    // Ensure the suffix slot content made it through
    const suffixSpan = child.querySelector('div span[slot="suffix"]')!;
    expect(suffixSpan.tagName).toBe('SPAN');
    expect(suffixSpan.textContent).toBe('Suffix text');
  });
});
