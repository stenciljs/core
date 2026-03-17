import { render, h, describe, it, expect } from '@stencil/vitest';

describe('clone-node', () => {
  it('should not duplicate nested component content when cloning', async () => {
    const { root, waitForChanges } = await render(<clone-node-root />);

    // Initially should have 1 slide with 1 text component containing 1 paragraph
    const initialTextElements = root.querySelectorAll('.text-content');
    expect(initialTextElements.length).toBe(1);

    const initialSlideElements = root.querySelectorAll('.slide-content');
    expect(initialSlideElements.length).toBe(1);

    // Click the button to clone the slide
    (root.querySelector('button') as HTMLButtonElement)!.click();
    await waitForChanges();
    await new Promise((r) => setTimeout(r, 100));

    // After cloning, should have 2 slides with 2 text components
    const clonedTextElements = root.querySelectorAll('.text-content');
    expect(clonedTextElements.length).toBe(2);

    const clonedSlideElements = root.querySelectorAll('.slide-content');
    expect(clonedSlideElements.length).toBe(2);

    // Verify each text element has the correct content
    for (const textEl of Array.from(clonedTextElements)) {
      expect(textEl).toHaveTextContent('Clone Node Text');
    }

    for (const slideEl of Array.from(clonedSlideElements)) {
      expect(slideEl).toHaveTextContent('Slide Content');
    }
  });
});
