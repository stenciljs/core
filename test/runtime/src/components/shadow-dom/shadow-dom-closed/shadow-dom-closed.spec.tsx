import { render, h, describe, it, expect } from '@stencil/vitest';

describe('shadow-dom-closed', () => {
  it('should not expose shadowRoot externally', async () => {
    const { root } = await render(<shadow-dom-closed />);

    // With mode: 'closed', shadowRoot should be null when accessed externally
    expect(root.shadowRoot).toBeNull();
  });

  it('should still render content correctly', async () => {
    const { root } = await render(<shadow-dom-closed />);

    // Even though shadowRoot is null, the component should still render
    // We can verify by checking the element exists and has expected structure
    expect(root).toBeDefined();
    expect(root.tagName.toLowerCase()).toBe('shadow-dom-closed');
  });

  it('should apply encapsulated styles', async () => {
    const { root } = await render(<shadow-dom-closed />);

    // Use the exposed method to check internal styling
    const bgColor = await root.getInternalBackgroundColor();
    expect(bgColor).toBe('rgb(128, 0, 128)');
  });

  it('should render internal content', async () => {
    const { root } = await render(<shadow-dom-closed />);

    // Use the exposed method to check internal content
    const text = await root.getInternalText();
    expect(text).toContain('Closed Shadow DOM Content');
  });

  it('should support slotted content', async () => {
    const { root } = await render(
      <shadow-dom-closed>
        <span>Slotted Content</span>
      </shadow-dom-closed>,
    );

    // The slotted content should be in the light DOM
    const slottedSpan = root.querySelector('span');
    expect(slottedSpan).toBeDefined();
    expect(slottedSpan!.textContent).toBe('Slotted Content');
  });

  it('should isolate styles from light DOM', async () => {
    const { root, doc } = await render(
      <div>
        <style>{`div { background: rgb(255, 0, 0); }`}</style>
        <shadow-dom-closed />
      </div>,
    );

    const closedComponent = root.querySelector('shadow-dom-closed') as HTMLElement & {
      getInternalBackgroundColor: () => Promise<string>;
    };

    // Internal div should have component styles, not affected by external styles
    const bgColor = await closedComponent.getInternalBackgroundColor();
    expect(bgColor).toBe('rgb(128, 0, 128)');
  });
});
