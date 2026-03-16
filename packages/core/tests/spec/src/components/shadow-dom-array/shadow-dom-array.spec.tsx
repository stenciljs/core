import { render, h, describe, it, expect } from '@stencil/vitest';

describe('shadow-dom-array', () => {
  it('renders children', async () => {
    const { waitForChanges } = await render(<shadow-dom-array-root></shadow-dom-array-root>);

    const shadowRoot = document.body.querySelector('shadow-dom-array')!.shadowRoot!;

    expect(shadowRoot.children.length).toBe(2);
    expect(shadowRoot.children[1].textContent!.trim()).toBe('0');

    const button = document.querySelector('button')!;

    button.click();
    await waitForChanges();

    expect(shadowRoot.children.length).toBe(3);
    expect(shadowRoot.children[2].textContent!.trim()).toBe('1');

    button.click();
    await waitForChanges();

    expect(shadowRoot.children.length).toBe(4);
    expect(shadowRoot.children[3].textContent!.trim()).toBe('2');
  });
});
