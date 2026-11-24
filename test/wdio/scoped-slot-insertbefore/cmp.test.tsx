import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('testing a `scoped="true"` component `insertBefore` method', () => {
  let host: HTMLScopedSlotInsertBeforeElement;
  let defaultSlot: HTMLDivElement;
  let startSlot: HTMLDivElement;
  let endSlot: HTMLDivElement;

  beforeEach(async () => {
    render({
      template: () => (
        <>
          <scoped-slot-insertbefore>
            <p>My initial slotted content.</p>
          </scoped-slot-insertbefore>
        </>
      ),
    });

    await $('#parentDiv').waitForExist();
    host = document.querySelector('scoped-slot-insertbefore');
    startSlot = host.querySelector('#parentDiv .start-slot');
    endSlot = host.querySelector('#parentDiv .end-slot');
    defaultSlot = host.querySelector('#parentDiv .default-slot');
  });

  it('slots nodes in the correct order when they have the same slot', async () => {
    expect(defaultSlot.children.length).toBe(2);
    expect(startSlot.children.length).toBe(1);
    expect(endSlot.children.length).toBe(1);

    const el1 = document.createElement('p');
    const el2 = document.createElement('p');
    const el3 = document.createElement('p');
    el1.innerText = 'Content 1. ';
    el2.innerText = 'Content 2. ';
    el3.innerText = 'Content 3. ';

    host.insertBefore(el1, null);
    host.insertBefore(el2, el1);
    host.insertBefore(el3, el2);

    expect(defaultSlot.children.length).toBe(5);
    expect(startSlot.children.length).toBe(1);
    expect(endSlot.children.length).toBe(1);
    expect(defaultSlot.textContent).toBe(
      `Default slot is here:My initial slotted content.Content 3. Content 2. Content 1. `,
    );
  });

  it('slots nodes in the correct slot despite the insertion order', async () => {
    expect(defaultSlot.children.length).toBe(2);
    expect(startSlot.children.length).toBe(1);
    expect(endSlot.children.length).toBe(1);

    const el1 = document.createElement('p');
    const el2 = document.createElement('p');
    const el3 = document.createElement('p');
    el1.innerText = 'Content 1. ';
    el1.slot = 'start-slot';
    el2.innerText = 'Content 2. ';
    el2.slot = 'end-slot';
    el3.innerText = 'Content 3. ';

    host.insertBefore(el1, null);
    host.insertBefore(el2, el1);
    host.insertBefore(el3, el2);

    expect(defaultSlot.children.length).toBe(3);
    expect(startSlot.children.length).toBe(2);
    expect(endSlot.children.length).toBe(2);
    expect(host.textContent).toBe(`My initial slotted content.Content 1. Content 2. Content 3. `);
  });

  it('can still use original `insertBefore` method', async () => {
    expect(defaultSlot.children.length).toBe(2);
    expect(startSlot.children.length).toBe(1);
    expect(endSlot.children.length).toBe(1);

    const el1 = document.createElement('p');
    const el2 = document.createElement('p');
    el1.innerText = 'Content 1. ';
    el2.innerText = 'Content 2. ';
    el2.slot = 'end-slot';

    host.__insertBefore(el1, null);
    host.__insertBefore(el2, host.querySelector('#parentDiv'));

    expect(host.firstElementChild.textContent).toBe('Content 2. ');
    expect(host.lastElementChild.textContent).toBe('Content 1. ');

    expect(defaultSlot.children.length).toBe(2);
    expect(startSlot.children.length).toBe(1);
    expect(endSlot.children.length).toBe(1);
  });

  describe('a host created without slotted content', () => {
    let freshHost: HTMLScopedSlotInsertBeforeElement;

    beforeEach(async () => {
      freshHost = document.createElement('scoped-slot-insertbefore');
      document.body.appendChild(freshHost);
      await freshHost.componentOnReady();
    });

    afterEach(() => freshHost.remove());

    it('slots a node inserted before `null`', async () => {
      const el = document.createElement('p');
      el.innerText = 'Content 1. ';
      freshHost.insertBefore(el, null);

      expect(freshHost.querySelector('#parentDiv .default-slot').textContent).toBe('Default slot is here:Content 1. ');
    });

    it('appends a node inserted before `null` once, whatever the number of slotted nodes', async () => {
      freshHost.append(document.createElement('p'), document.createElement('p'));
      const originalAppendChild = freshHost.appendChild;
      let appendChildCalls = 0;
      freshHost.appendChild = function <T extends Node>(node: T) {
        appendChildCalls++;
        return originalAppendChild.call(this, node);
      };

      freshHost.insertBefore(document.createElement('p'), null);

      expect(appendChildCalls).toBe(1);
      expect(freshHost.querySelector('#parentDiv .default-slot').children.length).toBe(4);
    });
  });

  it('removes a node assigned to a slot the component does not render', async () => {
    const el = document.createElement('p');
    el.slot = 'missing-slot';
    host.appendChild(el);

    expect(host.removeChild(el)).toBe(el);
    expect(el.isConnected).toBe(false);
  });
});
