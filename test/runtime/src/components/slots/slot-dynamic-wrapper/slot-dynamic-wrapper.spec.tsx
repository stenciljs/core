import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-dynamic-wrapper', () => {
  it('renders and toggles wrapper element', async () => {
    const { root, waitForChanges } = await render(<slot-dynamic-wrapper-root />);

    // Initial render with section wrapper
    expect(root.querySelector('.results1 section h1')).toHaveTextContent('parent text');

    // Click to change to article
    root.querySelector('button')!.click();
    await waitForChanges();

    expect(root.querySelector('.results1 section h1')).toBeNull();
    expect(root.querySelector('.results1 article h1')).toHaveTextContent('parent text');

    // Click to change back to section
    root.querySelector('button')!.click();
    await waitForChanges();

    expect(root.querySelector('.results1 section h1')).toHaveTextContent('parent text');
    expect(root.querySelector('.results1 article h1')).toBeNull();
    expect(root.querySelector('[hidden]')).toBeNull();
  });
});
