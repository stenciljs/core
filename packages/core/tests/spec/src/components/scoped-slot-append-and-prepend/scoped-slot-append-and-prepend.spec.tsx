import { render, h, describe, it, expect } from '@stencil/vitest';

describe('scoped-slot-append-and-prepend', () => {
  describe('append', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      await render(
        <scoped-slot-append-and-prepend>
          <p>My initial slotted content.</p>
        </scoped-slot-append-and-prepend>,
      );

      const host = document.querySelector('scoped-slot-append-and-prepend')!;
      const parentDiv = host.querySelector('#parentDiv')! as HTMLDivElement;

      expect(host).toBeDefined();
      expect(parentDiv).toBeDefined();
      expect(parentDiv.children.length).toBe(1);
      expect(parentDiv.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.append(el);

      expect(parentDiv.children.length).toBe(2);
      expect(parentDiv.children[1].textContent).toBe('The new slotted content.');
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

      expect(host).toBeDefined();
      expect(parentDiv).toBeDefined();
      expect(parentDiv.children.length).toBe(1);
      expect(parentDiv.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.appendChild(el);

      expect(parentDiv.children.length).toBe(2);
      expect(parentDiv.children[1].textContent).toBe('The new slotted content.');
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

      expect(host).toBeDefined();
      expect(parentDiv).toBeDefined();
      expect(parentDiv.children.length).toBe(1);
      expect(parentDiv.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.prepend(el);

      expect(parentDiv.children.length).toBe(2);
      expect(parentDiv.children[0].textContent).toBe('The new slotted content.');
    });
  });
});
