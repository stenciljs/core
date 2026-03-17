import { render, h, describe, it, expect } from '@stencil/vitest';

describe('dom-reattach', () => {
  it('should have proper values', async () => {
    const { root, waitForChanges } = await render(<dom-reattach />);

    const div = root.querySelector('div')!;
    expect(div.textContent).toContain('componentWillLoad: 1');
    expect(div.textContent).toContain('componentDidLoad: 1');
    expect(div.textContent).toContain('disconnectedCallback: 0');

    // Remove element from DOM
    root.remove();
    await waitForChanges();

    // Element should not be in document
    expect(document.querySelector('dom-reattach')).toBe(null);

    // Re-add element to document
    document.body.appendChild(root);
    await waitForChanges();

    const div2 = root.querySelector('div')!;
    expect(div2.textContent).toContain('disconnectedCallback: 1');

    // Remove again
    root.remove();
    await waitForChanges();

    expect(document.querySelector('dom-reattach')).toBe(null);

    // Re-add again
    document.body.appendChild(root);
    await waitForChanges();

    const div3 = root.querySelector('div')!;
    expect(div3.textContent).toContain('disconnectedCallback: 2');
  });
});
