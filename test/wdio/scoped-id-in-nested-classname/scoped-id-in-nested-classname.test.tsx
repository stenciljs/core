import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('scope-id-in-nested-classname', function () {
  it('should have root scope id in the nested element as classname', async () => {
    render({
      components: [],
      template: () => <cmp-level-1></cmp-level-1>,
    });
    await $('cmp-level-3').waitForStable();
    await expect($('cmp-level-3')).toHaveElementClass('sc-cmp-level-2');
    await expect($('cmp-level-3')).toHaveElementClass('sc-cmp-level-2');

    const padding = await $('cmp-level-3').getCSSProperty('padding');
    await expect(padding.parsed.value).toBe(8);

    const fontWeight = await $('cmp-level-3').getCSSProperty('font-weight');
    await expect(fontWeight.parsed.value).toBe(800);
  });

  it('should not have root scope id in slotted / user provided nested element as classname', async () => {
    render({
      components: [],
      template: () => (
        <cmp-level-1>
          <span id="test-element">Test</span>
        </cmp-level-1>
      ),
    });
    await expect($('#test-element')).not.toHaveElementClass('sc-cmp-level-1');
    await expect($('#test-element')).not.toHaveElementClass('sc-cmp-level-2');

    const padding = await $('#test-element').getCSSProperty('padding');
    await expect(padding.parsed.value).not.toBe(24);

    const fontWeight = await $('#test-element').getCSSProperty('font-weight');
    await expect(fontWeight.parsed.value).not.toBe(600);
  });
});
