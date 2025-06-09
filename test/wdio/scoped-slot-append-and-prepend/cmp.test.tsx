import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-append-and-prepend', () => {
  let host: HTMLScopedSlotAppendAndPrependElement;
  let parentDiv: HTMLDivElement;

  beforeEach(async () => {
    render({
      template: () => (
        <>
          <scoped-slot-append-and-prepend>
            <p>My initial slotted content.</p>
          </scoped-slot-append-and-prepend>

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

    const scopedSlotAppendAndPrepend = document.querySelector('scoped-slot-append-and-prepend');

    // The element to be inserted
    const el = document.createElement('p');
    el.innerText = 'The new slotted content.';

    await $('#appendNodes').waitForExist();
    document.querySelector('#appendNodes').addEventListener('click', () => {
      scopedSlotAppendAndPrepend.append(el);
    });

    document.querySelector('#appendChildNodes').addEventListener('click', () => {
      scopedSlotAppendAndPrepend.appendChild(el);
    });

    document.querySelector('#prependNodes').addEventListener('click', () => {
      scopedSlotAppendAndPrepend.prepend(el);
    });

    await $('#parentDiv').waitForExist();
    host = document.querySelector('scoped-slot-append-and-prepend');
    parentDiv = host.querySelector('#parentDiv');
  });

  describe('append', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      expect(host).toBeDefined();

      expect(parentDiv).toBeDefined();
      expect(parentDiv.children.length).toBe(1);
      expect(parentDiv.children[0].textContent).toBe('My initial slotted content.');

      const addButton = $('#appendNodes');
      await addButton.click();

      await browser.waitUntil(async () => parentDiv.children.length === 2);
      expect(parentDiv.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('appendChild', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      expect(host).toBeDefined();

      expect(parentDiv).toBeDefined();
      expect(parentDiv.children.length).toBe(1);
      expect(parentDiv.children[0].textContent).toBe('My initial slotted content.');

      const addButton = $('#appendChildNodes');
      await addButton.click();

      await browser.waitUntil(async () => parentDiv.children.length === 2);
      expect(parentDiv.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('prepend', () => {
    it('inserts a DOM element at the start of the slot', async () => {
      expect(host).toBeDefined();

      expect(parentDiv).toBeDefined();
      expect(parentDiv.children.length).toBe(1);
      expect(parentDiv.children[0].textContent).toBe('My initial slotted content.');

      const addButton = $('#prependNodes');
      await addButton.click();

      await browser.waitUntil(async () => parentDiv.children.length === 2);
      expect(parentDiv.children[0].textContent).toBe('The new slotted content.');
    });
  });
});
