import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('testing a `scoped="true"` component `insertBefore` method', () => {
  it('slots nodes in the correct order when they have the same slot', async () => {
    const { root } = await render(
      <scoped-slot-insertbefore>
        <p>My initial slotted content.</p>
      </scoped-slot-insertbefore>,
    );
    await waitForExist('scoped-slot-insertbefore.hydrated');
    const host = root;
    const startSlot = host.querySelector('#parentDiv .start-slot')! as HTMLDivElement;
    const endSlot = host.querySelector('#parentDiv .end-slot')! as HTMLDivElement;
    const defaultSlot = host.querySelector('#parentDiv .default-slot')! as HTMLDivElement;

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
    await render(
      <scoped-slot-insertbefore>
        <p>My initial slotted content.</p>
      </scoped-slot-insertbefore>,
    );

    const host = document.querySelector('scoped-slot-insertbefore')!;
    const startSlot = host.querySelector('#parentDiv .start-slot')! as HTMLDivElement;
    const endSlot = host.querySelector('#parentDiv .end-slot')! as HTMLDivElement;
    const defaultSlot = host.querySelector('#parentDiv .default-slot')! as HTMLDivElement;

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
    await render(
      <scoped-slot-insertbefore>
        <p>My initial slotted content.</p>
      </scoped-slot-insertbefore>,
    );

    const host = document.querySelector('scoped-slot-insertbefore') as any;
    const startSlot = host.querySelector('#parentDiv .start-slot')! as HTMLDivElement;
    const endSlot = host.querySelector('#parentDiv .end-slot')! as HTMLDivElement;
    const defaultSlot = host.querySelector('#parentDiv .default-slot')! as HTMLDivElement;

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
    const renderEmptyHost = async () => {
      const { root } = await render(<scoped-slot-insertbefore />);
      await waitForExist('scoped-slot-insertbefore.hydrated');
      return root as HTMLElement;
    };

    it('slots a node inserted before `null`', async () => {
      const host = await renderEmptyHost();
      const el = document.createElement('p');
      el.innerText = 'Content 1. ';
      host.insertBefore(el, null);

      expect(host.querySelector('#parentDiv .default-slot')!.textContent).toBe(
        'Default slot is here:Content 1. ',
      );
    });

    it('appends a node inserted before `null` once, whatever the number of slotted nodes', async () => {
      const host = await renderEmptyHost();
      host.append(document.createElement('p'), document.createElement('p'));
      const originalAppendChild = host.appendChild;
      let appendChildCalls = 0;
      host.appendChild = function <T extends Node>(node: T) {
        appendChildCalls++;
        return originalAppendChild.call(this, node) as T;
      };

      host.insertBefore(document.createElement('p'), null);

      expect(appendChildCalls).toBe(1);
      expect(host.querySelector('#parentDiv .default-slot')!.children.length).toBe(4);
    });
  });

  it('removes a node assigned to a slot the component does not render', async () => {
    const { root } = await render(<scoped-slot-insertbefore />);
    await waitForExist('scoped-slot-insertbefore.hydrated');
    const el = document.createElement('p');
    el.slot = 'missing-slot';
    root.appendChild(el);

    expect(root.removeChild(el)).toBe(el);
    expect(el.isConnected).toBe(false);
  });
});
