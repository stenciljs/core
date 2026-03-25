import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scope-id-in-nested-classname', () => {
  it('should have root scope id in the nested element as classname', async () => {
    await render(<cmp-level-1></cmp-level-1>);

    const level3 = document.querySelector('cmp-level-3')!;
    expect(level3.classList.contains('sc-cmp-level-2')).toBe(true);

    const padding = window.getComputedStyle(level3).padding;
    expect(padding).toBe('8px');

    const fontWeight = window.getComputedStyle(level3).fontWeight;
    expect(fontWeight).toBe('800');
  });

  it('should not have root scope id in slotted / user provided nested element as classname', async () => {
    await render(
      <cmp-level-1>
        <span id="test-element">Test</span>
      </cmp-level-1>,
    );

    const testElement = document.querySelector('#test-element')!;
    expect(testElement.classList.contains('sc-cmp-level-1')).toBe(false);
    expect(testElement.classList.contains('sc-cmp-level-2')).toBe(false);

    const padding = window.getComputedStyle(testElement).padding;
    expect(padding).not.toBe('24px');

    const fontWeight = window.getComputedStyle(testElement).fontWeight;
    expect(fontWeight).not.toBe('600');
  });
});
