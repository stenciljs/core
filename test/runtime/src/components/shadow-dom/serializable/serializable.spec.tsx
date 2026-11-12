import { render, describe, it, expect } from '@stencil/vitest';

describe('serializable', () => {
  it('includes shadow content when serializable is true', async () => {
    const { root } = await render(<serializable-cmp />);

    const html = root.getHTML({ serializableShadowRoots: true });

    expect(html).toContain('serializable content');
  });

  it('excludes shadow content when serializable is not set', async () => {
    const { root } = await render(<no-serializable-cmp />);

    const html = root.getHTML({ serializableShadowRoots: true });

    expect(html).not.toContain('not serializable content');
  });
});
