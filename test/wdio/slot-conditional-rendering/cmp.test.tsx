import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-conditional-rendering', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <slot-conditional-rendering>
          <span slot="header" id="slotted-header-element-id">
            Hello
          </span>
          <span id="slotted-content-element-id">World!</span>
        </slot-conditional-rendering>
      ),
    });

    await $('slot-conditional-rendering').waitForExist();
  });

  it('slots are not hidden', async () => {
    await expect($('#slotted-header-element-id')).not.toHaveAttribute('hidden');
    await expect($('#slotted-content-element-id')).not.toHaveAttribute('hidden');
  });

  it('header slot becomes hidden after hit the toggle button', async () => {
    await expect($('#slotted-header-element-id')).not.toHaveAttribute('hidden');

    await $('#header-visibility-toggle').click();

    await expect($('#slotted-header-element-id')).toHaveAttribute('hidden');
  });

  it('content slot becomes hidden after hit the toggle button', async () => {
    await expect($('#slotted-content-element-id')).not.toHaveAttribute('hidden');

    await $('#content-visibility-toggle').click();

    await expect($('#slotted-content-element-id')).toHaveAttribute('hidden');
  });
});
