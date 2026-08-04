import { render, h, describe, it, expect } from '@stencil/vitest';

describe('conditional-basic', () => {
  it('contains a button as a child', async () => {
    const { root } = await render(<conditional-basic />);
    expect(root.querySelector('button')).toBeTruthy();
  });

  it('button click rerenders', async () => {
    const { root, waitForChanges } = await render(<conditional-basic />);

    const button = root.querySelector('button')!;
    const results = root.querySelector('div.results')!;

    expect(results).toHaveTextContent('');

    button.click();
    await waitForChanges();

    expect(results).toHaveTextContent('Content');
  });
});
