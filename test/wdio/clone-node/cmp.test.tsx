import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, $$, browser, expect } from '@wdio/globals';

describe('clone-node', () => {
  before(async () => {
    render({
      components: [],
      template: () => <clone-node-root></clone-node-root>,
    });
  });

  it('should not duplicate nested component content when cloning', async () => {
    await $('clone-node-root.hydrated').waitForExist();

    // Initially should have 1 slide with 1 text component containing 1 paragraph
    const initialTextElements = await $$('.text-content');
    expect(initialTextElements).toHaveLength(1);

    const initialSlideElements = await $$('.slide-content');
    expect(initialSlideElements).toHaveLength(1);

    // Click the button to clone the slide
    const button = await $('button');
    await button.click();

    // Wait for the clone to be added
    await browser.pause(100);

    // After cloning, should have 2 slides with 2 text components
    // Each text component should have exactly 1 paragraph (not duplicated)
    const clonedTextElements = await $$('.text-content');
    expect(clonedTextElements).toHaveLength(2);

    const clonedSlideElements = await $$('.slide-content');
    expect(clonedSlideElements).toHaveLength(2);

    // Verify each text element has the correct content
    for (const textEl of clonedTextElements) {
      await expect(textEl).toHaveText('Clone Node Text');
    }

    for (const slideEl of clonedSlideElements) {
      await expect(slideEl).toHaveText('Slide Content');
    }
  });
});
