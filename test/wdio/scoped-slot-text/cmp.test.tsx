import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-text', () => {
  beforeEach(async () => {
    render({
      template: () => <cmp-label>This text should go in a slot</cmp-label>,
    });
  });

  /**
   * Helper function to retrieve custom element used by this test suite. If the element cannot be found, the test that
   * invoked this function shall fail.
   * @returns the custom element
   */
  async function getCmpLabel(): Promise<HTMLCmpLabelElement> {
    const customElementSelector = 'cmp-label';
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
    expect(cmpLabel.textContent.trim()).toBe('New text to go in the slot');
  });

  it('leaves the structure of the label intact', async () => {
    const cmpLabel: HTMLCmpLabelElement = await getCmpLabel();
    cmpLabel.textContent = 'New text for label structure testing';
    const label: HTMLLabelElement = await browser.waitUntil(async () => cmpLabel.querySelector('label'));

    /**
     * Expect two child nodes in the label
     * - a content reference text node
     * - the slotted text node
     */
    expect(label).toBeTruthy();
    expect(label.childNodes.length).toBe(2);
    expect((label.childNodes[0] as any)['s-cr'] as string).toBeDefined();
    expect(label.childNodes[1].textContent).toBe('New text for label structure testing');
  });
});
