import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-text-with-sibling', () => {
  beforeEach(async () => {
    render({
      template: () => <cmp-label-with-slot-sibling>This text should go in a slot</cmp-label-with-slot-sibling>,
    });
  });

  /**
   * Helper function to retrieve custom element used by this test suite. If the element cannot be found, the test that
   * invoked this function shall fail.
   * @returns the custom element
   */
  async function getCmpLabel(): Promise<HTMLCmpLabelElement> {
    const customElementSelector = 'cmp-label-with-slot-sibling';
    const cmpLabel: HTMLCmpLabelElement = document.querySelector(customElementSelector);
    await $(customElementSelector).waitForExist();
    if (!cmpLabel) {
      throw new Error(`Unable to find element using query selector '${customElementSelector}'`);
    }

    return cmpLabel;
  }

  it('sets the textContent in the slot location', async () => {
    const cmpLabel: HTMLCmpLabelElement = await getCmpLabel();
    cmpLabel.textContent = 'New text to go in the slot';
    await browser.waitUntil(
      async () => {
        expect(cmpLabel.textContent.trim()).toBe('New text to go in the slot');
        return true;
      },
      { timeoutMsg: 'textContent was not set' },
    );
  });

  it("doesn't override all children when assigning textContent", async () => {
    const cmpLabel: HTMLCmpLabelElement = await getCmpLabel();
    cmpLabel.textContent = "New text that we want to go in a slot, but don't care about for this test";
    const divElement = $(cmpLabel).$('div');
    await expect(divElement).toHaveText('Non-slotted text');
  });

  it('leaves the structure of the label intact', async () => {
    const cmpLabel: HTMLCmpLabelElement = await getCmpLabel();
    cmpLabel.textContent = 'New text for label structure testing';
    const label: HTMLLabelElement = await browser.waitUntil(async () => cmpLabel.querySelector('label'));

    /**
     * Expect three child nodes in the label
     * - a content reference text node
     * - the slotted text node
     * - the non-slotted text
     */
    expect(label).toBeTruthy();
    expect(label.childNodes.length).toBe(3);
    expect((label.childNodes[0] as any)['s-cr'] as string).toBeDefined();
    expect(label.childNodes[1].textContent).toBe('New text for label structure testing');
    expect(label.childNodes[2].textContent).toBe('Non-slotted text');
  });
});
