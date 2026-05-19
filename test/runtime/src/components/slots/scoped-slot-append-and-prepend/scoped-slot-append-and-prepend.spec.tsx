import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-append-and-prepend', () => {
  describe('append', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      const { root } = await render(
        <scoped-slot-append-and-prepend>
          <p>My initial slotted content.</p>
        </scoped-slot-append-and-prepend>,
      );
      await waitForExist('scoped-slot-append-and-prepend.hydrated');
      const host = root;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;
      // slotted content lives inside <slot> which is a child of #parentDiv
      const slot = parentDiv.querySelector('slot')!;

      expect(host).toBeDefined();
      expect(parentDiv).toBeDefined();
      expect(slot.children.length).toBe(1);
      expect(slot.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.append(el);

      expect(slot.children.length).toBe(2);
      expect(slot.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('appendChild', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      await render(
        <scoped-slot-append-and-prepend>
          <p>My initial slotted content.</p>
        </scoped-slot-append-and-prepend>,
      );

      const host = document.querySelector('scoped-slot-append-and-prepend')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;
      const slot = parentDiv.querySelector('slot')!;

      expect(host).toBeDefined();
      expect(parentDiv).toBeDefined();
      expect(slot.children.length).toBe(1);
      expect(slot.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.appendChild(el);

      expect(slot.children.length).toBe(2);
      expect(slot.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('prepend', () => {
    it('inserts a DOM element at the start of the slot', async () => {
      await render(
        <scoped-slot-append-and-prepend>
          <p>My initial slotted content.</p>
        </scoped-slot-append-and-prepend>,
      );

      const host = document.querySelector('scoped-slot-append-and-prepend')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;
      const slot = parentDiv.querySelector('slot')!;

      expect(host).toBeDefined();
      expect(parentDiv).toBeDefined();
      expect(slot.children.length).toBe(1);
      expect(slot.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.prepend(el);

      expect(slot.children.length).toBe(2);
      expect(slot.children[0].textContent).toBe('The new slotted content.');
    });
  });
});
