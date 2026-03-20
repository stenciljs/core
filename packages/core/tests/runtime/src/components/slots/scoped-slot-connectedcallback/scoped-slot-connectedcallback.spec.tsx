import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-slot-connectedcallback', () => {
  it('should have slotted content available in connectedCallback', async () => {
    await render(<scoped-slot-connectedcallback-parent />);

    const child = document.querySelector('scoped-slot-connectedcallback-child')!;
    const connectedAttr = child.getAttribute('data-connected-slot-available');
    const willLoadAttr = child.getAttribute('data-willload-slot-available');

    // Both connectedCallback and componentWillLoad should have access to slotted content
    expect(connectedAttr).toBe('true');
    expect(willLoadAttr).toBe('true');
  });

  it('should render slotted content correctly', async () => {
    await render(<scoped-slot-connectedcallback-parent />);

    const slottedContent = document.querySelector('#slotted-content');
    expect(slottedContent).toBeTruthy();
    expect(slottedContent!.textContent).toBe('Slotted Content');

    const wrapper = document.querySelector('.wrapper')!;
    const text = wrapper.textContent;
    expect(text).toContain('Before slot');
    expect(text).toContain('Slotted Content');
    expect(text).toContain('After slot');
  });
});
