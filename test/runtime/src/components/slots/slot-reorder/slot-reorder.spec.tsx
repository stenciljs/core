import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-reorder', () => {
  it('renders and reorders slots correctly', async () => {
    const { root, waitForChanges } = await render(<slot-reorder-root />);

    /**
     * In the new slot model each <slot> is a real DOM element followed immediately
     * by its <slot-fb> sibling. In "ordered" state the render order is:
     *   slot(default), slot-fb(default), slot(slot-a), slot-fb(slot-a), slot(slot-b), slot-fb(slot-b)
     * indices:   0           1               2               3               4            5
     */
    function ordered() {
      // results1 — no slotted content, all slot-fbs visible
      let r = root.querySelector('.results1 div')!;
      expect(r.children[1].textContent!.trim()).toBe('fallback default');
      expect(r.children[1] as HTMLElement).toBeVisible();
      expect(r.children[1].getAttribute('name')).toBeNull();
      expect(r.children[3].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[3] as HTMLElement).toBeVisible();
      expect(r.children[3].getAttribute('name')).toBe('slot-a');
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[5] as HTMLElement).toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-b');

      // results2 — default slot has content
      r = root.querySelector('.results2 div')!;
      expect(r.children[0].textContent!.trim()).toBe('default content'); // slot
      expect(r.children[1].textContent!.trim()).toBe('fallback default'); // slot-fb hidden
      expect(r.children[1] as HTMLElement).not.toBeVisible();
      expect(r.children[1].getAttribute('name')).toBeNull();
      expect(r.children[3].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[3] as HTMLElement).toBeVisible();
      expect(r.children[3].getAttribute('name')).toBe('slot-a');
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[5] as HTMLElement).toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-b');

      // results3 — all slots have content
      r = root.querySelector('.results3 div')!;
      expect(r.children[0].textContent!.trim()).toBe('default content');
      expect(r.children[1].textContent!.trim()).toBe('fallback default');
      expect(r.children[1] as HTMLElement).not.toBeVisible();
      expect(r.children[1].getAttribute('name')).toBeNull();
      expect(r.children[2].textContent!.trim()).toBe('slot-a content');
      expect(r.children[3].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[3] as HTMLElement).not.toBeVisible();
      expect(r.children[3].getAttribute('name')).toBe('slot-a');
      expect(r.children[4].textContent!.trim()).toBe('slot-b content');
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[5] as HTMLElement).not.toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-b');

      // results4 — same content as results3, different source order
      r = root.querySelector('.results4 div')!;
      expect(r.children[0].textContent!.trim()).toBe('default content');
      expect(r.children[1].textContent!.trim()).toBe('fallback default');
      expect(r.children[1] as HTMLElement).not.toBeVisible();
      expect(r.children[1].getAttribute('name')).toBeNull();
      expect(r.children[2].textContent!.trim()).toBe('slot-a content');
      expect(r.children[3].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[3] as HTMLElement).not.toBeVisible();
      expect(r.children[3].getAttribute('name')).toBe('slot-a');
      expect(r.children[4].textContent!.trim()).toBe('slot-b content');
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[5] as HTMLElement).not.toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-b');
    }

    /**
     * Reordered state render order:
     *   slot(slot-b), slot-fb(slot-b), slot(default), slot-fb(default), slot(slot-a), slot-fb(slot-a)
     * indices:  0           1               2               3               4              5
     */
    function reordered() {
      // results1 — no content, all slot-fbs visible
      let r = root.querySelector('.results1 div')!;
      expect(r.children[1].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[1] as HTMLElement).toBeVisible();
      expect(r.children[1].getAttribute('name')).toBe('slot-b');
      expect(r.children[3].textContent!.trim()).toBe('fallback default');
      expect(r.children[3] as HTMLElement).toBeVisible();
      expect(r.children[3].getAttribute('name')).toBeNull();
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[5] as HTMLElement).toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-a');

      // results2 — default slot has content
      r = root.querySelector('.results2 div')!;
      expect(r.children[1].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[1] as HTMLElement).toBeVisible();
      expect(r.children[1].getAttribute('name')).toBe('slot-b');
      expect(r.children[2].textContent!.trim()).toBe('default content'); // slot
      expect(r.children[3].textContent!.trim()).toBe('fallback default');
      expect(r.children[3] as HTMLElement).not.toBeVisible();
      expect(r.children[3].getAttribute('name')).toBeNull();
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[5] as HTMLElement).toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-a');

      // results3 — all slots have content
      r = root.querySelector('.results3 div')!;
      expect(r.children[0].textContent!.trim()).toBe('slot-b content');
      expect(r.children[1].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[1] as HTMLElement).not.toBeVisible();
      expect(r.children[1].getAttribute('name')).toBe('slot-b');
      expect(r.children[2].textContent!.trim()).toBe('default content');
      expect(r.children[3].textContent!.trim()).toBe('fallback default');
      expect(r.children[3] as HTMLElement).not.toBeVisible();
      expect(r.children[3].getAttribute('name')).toBeNull();
      expect(r.children[4].textContent!.trim()).toBe('slot-a content');
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[5] as HTMLElement).not.toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-a');

      // results4 — same content as results3
      r = root.querySelector('.results4 div')!;
      expect(r.children[0].textContent!.trim()).toBe('slot-b content');
      expect(r.children[1].textContent!.trim()).toBe('fallback slot-b');
      expect(r.children[1] as HTMLElement).not.toBeVisible();
      expect(r.children[1].getAttribute('name')).toBe('slot-b');
      expect(r.children[2].textContent!.trim()).toBe('default content');
      expect(r.children[3].textContent!.trim()).toBe('fallback default');
      expect(r.children[3] as HTMLElement).not.toBeVisible();
      expect(r.children[3].getAttribute('name')).toBeNull();
      expect(r.children[4].textContent!.trim()).toBe('slot-a content');
      expect(r.children[5].textContent!.trim()).toBe('fallback slot-a');
      expect(r.children[5] as HTMLElement).not.toBeVisible();
      expect(r.children[5].getAttribute('name')).toBe('slot-a');
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
