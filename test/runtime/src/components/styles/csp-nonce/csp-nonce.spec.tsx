import { h, describe, it, expect, render, waitForExist } from '@stencil/vitest';

describe('csp nonce', () => {
  it('applies the nonce set by setNonce() to runtime style tags', async () => {
    const { root } = await render(<csp-nonce-cmp />, { waitForReady: false });
    await waitForExist('css-url-paths.hydrated');

    const styleElm = document.head?.querySelector('style');
    expect(styleElm).toBeTruthy();
    expect(styleElm?.getAttribute('nonce')).toBe('test-csp-nonce');
  });
});
