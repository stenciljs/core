import { render, describe, it, expect } from '@stencil/vitest';

describe('clonable', () => {
  it('copies rendered shadow content into the clone when clonable is true', async () => {
    const { root } = await render(<clonable-cmp />);

    const clone = root.cloneNode(true) as HTMLElement;

    expect(clone.shadowRoot!.querySelector('div')?.textContent).toBe('clonable content');
  });

  it('does not copy rendered shadow content into the clone when clonable is not set', async () => {
    const { root } = await render(<no-clonable-cmp />);

    const clone = root.cloneNode(true) as HTMLElement;

    expect(clone.shadowRoot!.querySelector('div')).toBeNull();
  });
});
