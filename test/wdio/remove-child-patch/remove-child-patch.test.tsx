import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

/**
 * Tests for the patched `removeChild()` method on `scoped` components.
 */
describe('remove-child-patch', () => {
  let host: HTMLElement | undefined;

  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <>
          <remove-child-patch>
            <span>Slotted 1</span>
            <span>Slotted 2</span>
          </remove-child-patch>

          <button id="remove-child-button" type="button">
            Remove Last Child
          </button>
          <button id="remove-child-div-button" type="button">
            Remove Child Div
          </button>
        </>
      ),
    });

    await $('#remove-child-button').waitForExist();
    document.querySelector('#remove-child-button').addEventListener('click', () => {
      const el = document.querySelector('remove-child-patch');
      const slotContainer = el.querySelector('.slot-container');
      const elementToRemove = slotContainer.children[slotContainer.children.length - 1];
      el.removeChild(elementToRemove);
    });

    document.querySelector('#remove-child-div-button').addEventListener('click', () => {
      const el = document.querySelector('remove-child-patch');
      const elementToRemove = el.querySelector('div');
      el.removeChild(elementToRemove);
    });
    host = document.querySelector('remove-child-patch');
  });

  it('should remove the last slotted node', async () => {
    let slotContainer = $(host).$$('span');
    await expect(slotContainer).toBeElementsArrayOfSize(2);

    await $('button').click();

    slotContainer = $(host).$$('span');
    await expect(slotContainer).toBeElementsArrayOfSize(1);
  });

  it('should show slot-fb if the last slotted node is removed', async () => {
    const slotContainer = $(host).$$('span');
    await expect(slotContainer).toBeElementsArrayOfSize(2);

    const button = $('#remove-child-button');
    await button.click();
    await button.click();

    const slottedSpansAfter = $(host).$$('span');
    expect(await slottedSpansAfter.length).toBe(0);
    await expect($(host).$('.slot-container')).toHaveText('Slot fallback content');
  });

  it('should still be able to remove nodes not slotted', async () => {
    await expect($(host).$('div')).toBeExisting();

    await browser.pause(3000);
    const button = $('#remove-child-div-button');
    await button.click();

    await expect(await $(host).$('div').isExisting()).toBe(false);
  });
});
