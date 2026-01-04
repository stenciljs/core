import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

import { defineCustomElement } from '../test-components/global-styles.js';

describe('dom-reattach', function () {
  beforeEach(() => {
    defineCustomElement();

    render({
      components: [],
      template: () => <global-styles></global-styles>,
    });
  });

  it('should have proper values', async () => {
    const borderProperty = await $('global-styles').getCSSProperty('border');
    // Browsers may render 5px as 4.8px due to subpixel rendering, so we check for the key parts
    expect(borderProperty.value).toContain('dotted');
    expect(borderProperty.value).toContain('rgb(255, 0, 0)');
    // Check that the border width is approximately 5px (allowing for subpixel rendering)
    const widthMatch = borderProperty.value.match(/([\d.]+)px/);
    expect(widthMatch).toBeTruthy();
    const width = parseFloat(widthMatch[1]);
    expect(width).toBeGreaterThanOrEqual(4.5);
    expect(width).toBeLessThanOrEqual(5.5);
  });
});
