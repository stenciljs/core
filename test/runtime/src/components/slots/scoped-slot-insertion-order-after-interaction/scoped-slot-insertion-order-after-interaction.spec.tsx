import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('scoped-slot-insertion-order-after-interaction', () => {
  describe('append', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      const { root, waitForChanges } = await render(
        <scoped-slot-insertion-order-after-interaction>
          <p>My initial slotted content.</p>
        </scoped-slot-insertion-order-after-interaction>,
      );

      await waitForExist('scoped-slot-insertion-order-after-interaction.hydrated');
      const host = root;
      expect(host).toBeDefined();

      expect(host.children.length).toBe(1);
      expect(host.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.append(el);

      expect(host.children.length).toBe(2);
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');

      const text = host.querySelector('p')!;
      text.click();
      await waitForChanges();

      expect((host as HTMLElement).dataset.counter).toBe('1');
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('appendChild', () => {
    it('inserts a DOM element at the end of the slot', async () => {
      const { root, waitForChanges } = await render(
        <scoped-slot-insertion-order-after-interaction>
          <p>My initial slotted content.</p>
        </scoped-slot-insertion-order-after-interaction>,
      );
      await waitForExist('scoped-slot-insertion-order-after-interaction.hydrated');
      const host = root;
      expect(host).toBeDefined();

      expect(host.children.length).toBe(1);
      expect(host.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.appendChild(el);

      expect(host.children.length).toBe(2);
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');

      const text = host.querySelector('p')!;
      text.click();
      await waitForChanges();

      expect((host as HTMLElement).dataset.counter).toBe('1');
      expect(host.children[0].textContent).toBe('My initial slotted content.');
      expect(host.children[1].textContent).toBe('The new slotted content.');
    });
  });

  describe('prepend', () => {
    it('inserts a DOM element at the start of the slot', async () => {
      const { root, waitForChanges } = await render(
        <scoped-slot-insertion-order-after-interaction>
          <p>My initial slotted content.</p>
        </scoped-slot-insertion-order-after-interaction>,
      );
      await waitForExist('scoped-slot-insertion-order-after-interaction.hydrated');
      const host = root;
      expect(host).toBeDefined();

      expect(host.children.length).toBe(1);
      expect(host.children[0].textContent).toBe('My initial slotted content.');

      const el = document.createElement('p');
      el.innerText = 'The new slotted content.';
      host.prepend(el);

      expect(host.children.length).toBe(2);
      expect(host.children[0].textContent).toBe('The new slotted content.');
      expect(host.children[1].textContent).toBe('My initial slotted content.');

      const text = host.querySelector('p')!;
      text.click();
      await waitForChanges();

      expect((host as HTMLElement).dataset.counter).toBe('1');
      expect(host.children[0].textContent).toBe('The new slotted content.');
      expect(host.children[1].textContent).toBe('My initial slotted content.');
    });
  });
});
