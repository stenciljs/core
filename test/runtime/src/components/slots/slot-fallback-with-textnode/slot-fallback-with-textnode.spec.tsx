import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-fallback-with-textnode', () => {
  it('should hide fallback content when provided slot is text node', async () => {
    const { root, waitForChanges } = await render(<slot-fallback-textnode-root />);

    expect(root.querySelector('.container')).toHaveTextContent('DEFAULT');

    root.querySelector<HTMLButtonElement>('#toggle-button')!.click();
    await waitForChanges();

    expect(root.querySelector('.container')!.textContent!.trim()).not.toBe('DEFAULT');
    expect(root.querySelector('.container')).toHaveTextContent('JD');
  });
});
