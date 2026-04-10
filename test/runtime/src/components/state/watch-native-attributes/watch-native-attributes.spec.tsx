import { render, h, describe, it, expect } from '@stencil/vitest';

describe('watch native attributes', () => {
  it('triggers the callback for the watched attribute', async () => {
    const { root, waitForChanges } = await render(
      <watch-native-attributes aria-label='myStartingLabel' />,
    );

    const div = root.querySelector('div')!;

    expect(div).toHaveTextContent('Label: myStartingLabel');
    expect(div).toHaveTextContent('Callback triggered: false');

    root.setAttribute('aria-label', 'myNewLabel');
    await waitForChanges();

    expect(div).toHaveTextContent('Label: myNewLabel');
    expect(div).toHaveTextContent('Callback triggered: true');
  });
});
