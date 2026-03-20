import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-reorder', () => {
  it('renders and reorders slots correctly', async () => {
    const { root, waitForChanges } = await render(<slot-reorder-root />);

    function ordered() {
      let r = root.querySelector('.results1 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(false);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[1].hasAttribute('hidden')).toBe(false);
      expect(r.children[1].getAttribute('name')).toBe('slot-a');
      expect(r.children[2].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[2].hasAttribute('hidden')).toBe(false);
      expect(r.children[2].getAttribute('name')).toBe('slot-b');

      r = root.querySelector('.results2 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent!.trim()).toBe('default content');
      expect(r.children[2].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(false);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');
      expect(r.children[3].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[3].hasAttribute('hidden')).toBe(false);
      expect(r.children[3].getAttribute('name')).toBe('slot-b');

      r = root.querySelector('.results3 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent!.trim()).toBe('default content');
      expect(r.children[2].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');
      expect(r.children[3].textContent!.trim()).toBe('slot-a content');
      expect(r.children[4].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-b');
      expect(r.children[5].textContent!.trim()).toBe('slot-b content');

      r = root.querySelector('.results4 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent!.trim()).toBe('default content');
      expect(r.children[2].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');
      expect(r.children[3].textContent!.trim()).toBe('slot-a content');
      expect(r.children[4].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-b');
      expect(r.children[5].textContent!.trim()).toBe('slot-b content');
    }

    function reordered() {
      let r = root.querySelector('.results1 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(false);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent!.trim()).toBe('fallback default');
      expect(r.children[1].hasAttribute('hidden')).toBe(false);
      expect(r.children[1].getAttribute('name')).toBe(null);
      expect(r.children[2].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(false);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');

      r = root.querySelector('.results2 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(false);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent!.trim()).toBe('fallback default');
      expect(r.children[1].hasAttribute('hidden')).toBe(true);
      expect(r.children[1].getAttribute('name')).toBe(null);
      expect(r.children[2].textContent!.trim()).toBe('default content');
      expect(r.children[3].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[3].hasAttribute('hidden')).toBe(false);
      expect(r.children[3].getAttribute('name')).toBe('slot-a');

      r = root.querySelector('.results3 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent!.trim()).toBe('slot-b content');
      expect(r.children[2].textContent!.trim()).toBe('fallback default');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe(null);
      expect(r.children[3].textContent!.trim()).toBe('default content');
      expect(r.children[4].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-a');
      expect(r.children[5].textContent!.trim()).toBe('slot-a content');

      r = root.querySelector('.results4 div')!;
      expect(r.children[0].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent!.trim()).toBe('slot-b content');
      expect(r.children[2].textContent!.trim()).toBe('fallback default');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe(null);
      expect(r.children[3].textContent!.trim()).toBe('default content');
      expect(r.children[4].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-a');
      expect(r.children[5].textContent!.trim()).toBe('slot-a content');
    }

    // Initial state
    ordered();

    // Click to reorder
    root.querySelector('button')!.click();
    await waitForChanges();
    reordered();

    // Click to go back to ordered
    root.querySelector('button')!.click();
    await waitForChanges();
    ordered();

    // Click to reorder again
    root.querySelector('button')!.click();
    await waitForChanges();
    reordered();
  });
});
