import { render, h, describe, it, expect } from '@stencil/vitest';

describe('tag-names', () => {
  it('should load tags with numbers in them', async () => {
    const { root } = await render(
      <div>
        <tag-88 />
        <tag-3d-component />
      </div>,
    );

    expect(root.querySelector('tag-3d-component div')).toHaveTextContent('tag-3d-component');
    expect(root.querySelector('tag-88 div')).toHaveTextContent('tag-88');
  });
});
