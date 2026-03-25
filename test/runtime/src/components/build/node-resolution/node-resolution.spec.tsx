import { render, h } from '@stencil/vitest';
import { describe, it, expect } from 'vitest';

describe('node-resolution', () => {
  it('should import from the right sources', async () => {
    const { root } = await render(<node-resolution />);

    expect(root.querySelector('#module-index')).toHaveTextContent('module/index.js');
    expect(root.querySelector('#module')).toHaveTextContent('module.js');
  });
});
