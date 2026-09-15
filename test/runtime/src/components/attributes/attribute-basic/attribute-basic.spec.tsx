import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

describe('attribute-basic', () => {
  it('button click rerenders', async () => {
    const { root, waitForChanges } = await render(<attribute-basic-root />);

    expect(root.querySelector('.single')).toHaveTextContent('single');
    expect(root.querySelector('.multiWord')).toHaveTextContent('multiWord');
    expect(root.querySelector('.customAttr')).toHaveTextContent('my-custom-attr');
    expect(root.querySelector('.htmlForLabel')).toHaveAttribute('for', 'a');
    expect(root.querySelector('.getter')).toHaveTextContent('getter');

    // Click the button to update attributes
    root.querySelector('button')!.click();
    await waitForChanges();

    expect(root.querySelector('.single')).toHaveTextContent('single-update');
    expect(root.querySelector('.multiWord')).toHaveTextContent('multiWord-update');
    expect(root.querySelector('.customAttr')).toHaveTextContent('my-custom-attr-update');
    expect(root.querySelector('.getter')).toHaveTextContent('getter-update');
  });
});
