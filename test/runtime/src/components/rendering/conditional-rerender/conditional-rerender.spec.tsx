import { render, h, describe, it, expect, waitForStable } from '@stencil/vitest';

describe('conditional-rerender', () => {
  it('contains a button as a child', async () => {
    const { root } = await render(<conditional-rerender-root />);

    // Wait for the setTimeout to complete
    await waitForStable('section');

    const main = root.querySelector('main')!;
    expect(main).toHaveTextContent('Header');
    expect(main).toHaveTextContent('Content');
    expect(main).toHaveTextContent('Footer');
    expect(main).toHaveTextContent('Nav');
  });
});
