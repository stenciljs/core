import { describe, it, expect, render, waitForExist, h } from '@stencil/vitest';

describe('stencil-sibling', () => {
  it('loads sibling root from external sibling project', async () => {
    const { root } = await render(<stencil-sibling />, { waitForReady: false });
    await waitForExist('stencil-sibling.hydrated');

    const siblingRoot = root.querySelector('sibling-root');
    expect(siblingRoot).toBeTruthy();

    // Wait for sibling-root to hydrate (it has async componentWillLoad)
    await waitForExist('sibling-root.hydrated');

    const section = siblingRoot!.querySelector('div section');
    expect(section).toHaveTextContent('sibling-shadow-dom');

    const article = siblingRoot!.querySelector('article');
    expect(article).toHaveTextContent('sibling-light-dom');
  });
});
