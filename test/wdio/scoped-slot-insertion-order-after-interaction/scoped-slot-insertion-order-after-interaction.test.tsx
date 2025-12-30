import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-insertion-order-after-interaction', () => {
  let host: HTMLScopedSlotInsertionOrderAfterInteractionElement;

  beforeEach(async () => {
    render({
      template: () => (
        <>
          <scoped-slot-insertion-order-after-interaction>
            <p>My initial slotted content.</p>
          </scoped-slot-insertion-order-after-interaction>

          <button type="button" id="appendNodes">
            append nodes via "append"
          </button>
          <button type="button" id="appendChildNodes">
            append nodes via "appendChild"
          </button>
          <button type="button" id="prependNodes">
            prepend nodes
          </button>
        </>
      ),
    });

    const scopedSlotInsertionOrderAfterInteraction = document.querySelector(
      'scoped-slot-insertion-order-after-interaction',
    );

    // The element to be inserted
    const el = document.createElement('p');
    el.innerText = 'The new slotted content.';

    await $('#appendNodes').waitForExist();
    document.querySelector('#appendNodes').addEventListener('click', () => {
      scopedSlotInsertionOrderAfterInteraction.append(el);
    });

    document.querySelector('#appendChildNodes').addEventListener('click', () => {
      scopedSlotInsertionOrderAfterInteraction.appendChild(el);
    });

    document.querySelector('#prependNodes').addEventListener('click', () => {
      scopedSlotInsertionOrderAfterInteraction.prepend(el);
    });

    host = document.querySelector('scoped-slot-insertion-order-after-interaction');
  });

  describe('append', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      expect(host).toBeDefined();

      await browser.waitUntil(async () => host.children.length === 1);
      expect(host.children[0].textContent).toBe('My initial slotted content.');

      const addButton = $('#appendNodes');
      await addButton.click();

      await browser.waitUntil(async () => host.children.length === 2);
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');

      const text = $('p');
      await text.click();
      await browser.waitUntil(async () => host.dataset.counter === '1');
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('appendChild', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      expect(host).toBeDefined();

      await browser.waitUntil(async () => host.children.length === 1);
      expect(host.children[0].textContent).toBe('My initial slotted content.');

      const addButton = $('#appendChildNodes');
      await addButton.click();

      await browser.waitUntil(async () => host.children.length === 2);
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');

      const text = $('p');
      await text.click();
      await browser.waitUntil(async () => host.dataset.counter === '1');
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('prepend', () => {
    it('inserts a DOM element at the start of the slot', async () => {
      expect(host).toBeDefined();

      await browser.waitUntil(async () => host.children.length === 1);
      expect(host.children[0].textContent).toBe('My initial slotted content.');

      const addButton = $('#prependNodes');
      await addButton.click();

      await browser.waitUntil(async () => host.children.length === 2);
      expect(host.children[0].textContent).toBe('The new slotted content.');
      expect(host.children[1].textContent).toBe('My initial slotted content.');

      const text = $('p');
      await text.click();
      await browser.waitUntil(async () => host.dataset.counter === '1');
      expect(host.children[0].textContent).toBe('The new slotted content.');
      expect(host.children[1].textContent).toBe('My initial slotted content.');
    });
  });
});
