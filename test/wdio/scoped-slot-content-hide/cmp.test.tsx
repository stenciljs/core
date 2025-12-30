import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser } from '@wdio/globals';

describe('scoped-slot-content-hide', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <scoped-slot-content-hide use-slot={false}>
            testing
            <div class="inside-slot">inside slot</div>
          </scoped-slot-content-hide>
        </>
      ),
    });

    await $('scoped-slot-content-hide').waitForExist();
  });

  /**
   * Helper function to retrieve custom element used by this test suite.
   * @returns the custom element
   */
  async function getComponent(): Promise<HTMLScopedSlotContentHideElement> {
    const customElementSelector = 'scoped-slot-content-hide';
    const component: HTMLScopedSlotContentHideElement = document.querySelector(customElementSelector);
    if (!component) {
      throw new Error(`Unable to find element using query selector '${customElementSelector}'`);
    }
    return component;
  }

  it('can toggle content visibility according to the presence of a slot', async () => {
    const root = await getComponent();
    const slottedDiv = root.querySelector('.inside-slot') as HTMLElement;

    // Initially useSlot is false, so content should be hidden
    expect(root.textContent).not.toContain('testing');
    expect(slottedDiv).toBeDefined();
    expect(slottedDiv.hidden).toBe(true);

    // Enable the slot
    root.useSlot = true;
    await browser.pause(100);

    expect(root.textContent).toContain('testing');
    expect(slottedDiv.hidden).toBe(false);

    // Disable the slot again
    root.useSlot = false;
    await browser.pause(100);

    expect(root.textContent).not.toContain('testing');
    expect(slottedDiv.hidden).toBe(true);

    // Enable the slot again
    root.useSlot = true;
    await browser.pause(100);

    expect(root.textContent).toContain('testing');
    expect(slottedDiv.hidden).toBe(false);
  });
});
