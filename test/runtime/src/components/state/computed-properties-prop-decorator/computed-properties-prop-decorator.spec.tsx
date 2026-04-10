import { render, h, describe, it, expect } from '@stencil/vitest';

describe('computed-properties-prop-decorator', () => {
  it('correctly sets computed property `@Prop()`s and triggers re-renders', async () => {
    const { root, waitForChanges } = await render(<computed-properties-prop-decorator />);

    expect(root.querySelector('div')).toHaveTextContent('no content');

    root.setAttribute('first', 'These');
    root.setAttribute('middle', 'are');
    root.setAttribute('last', 'my props');
    await waitForChanges();

    expect(root.querySelector('div')).toHaveTextContent('These are my props');
  });

  it('has the default value reflected to the correct attribute on the host', async () => {
    const { root } = await render(<computed-properties-prop-decorator-reflect />);

    expect(root).toHaveAttribute('first-name', 'no');
    expect(root).toHaveAttribute('last-name', 'content');
  });
});
