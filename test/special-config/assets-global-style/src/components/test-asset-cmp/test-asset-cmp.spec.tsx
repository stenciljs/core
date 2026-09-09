import { render, h, describe, it, expect } from '@stencil/vitest';

describe('getAssetPath', () => {
  it('has the same asset path across all outputs', async () => {
    const { root } = await render(<test-asset-cmp />);
    expect(root.querySelector('.assets-path')).toHaveTextContent(
      'Asset path: /dist/custom-assets/assets/test-file.txt',
    );
  });
});
