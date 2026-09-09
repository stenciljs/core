import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('attribute-html', () => {
  it('should have proper values', async () => {
    const { root } = await render(
      `<attribute-html-root str-attr="my string" any-attr="0" nu-attr="12" />`,
    );

    await waitForExist('#str-attr');
    expect(root.querySelector('#str-attr')).toHaveTextContent('my string string');
    expect(root.querySelector('#any-attr')).toHaveTextContent('0 string');
    expect(root.querySelector('#nu-attr')).toHaveTextContent('12 number');
  });
});
