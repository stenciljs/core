import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-fallback-with-forwarded-slot', () => {
  it('renders fallback via prop', async () => {
    const { root, waitForChanges } = await render(
      <slot-forward-root label='Slot fallback via property' />,
    );
    await waitForExist('slot-forward-root.hydrated');

    const cmp = root;
    const fb = cmp.querySelector('slot-fb') as HTMLElement;

    expect(fb).toHaveTextContent('Slot fallback via property');
    expect(fb.getAttribute('hidden')).toBeNull();
    expect(fb.hidden).toBe(false);

    // Add slotted content dynamically
    const p = document.createElement('p');
    p.textContent = 'Slot content via slot';
    p.slot = 'label';
    cmp.appendChild(p);
    await waitForChanges();

    expect(cmp).toHaveTextContent('Slot content via slot');
    expect(fb.getAttribute('hidden')).toBe('');
    expect(fb.hidden).toBe(true);
  });

  it('should hide slot-fb elements when slotted content exists', async () => {
    const { root, waitForChanges } = await render(
      <slot-forward-root label='Slot fallback via property'>
        <div slot='label'>Slot content via slot</div>
      </slot-forward-root>,
    );
    await waitForExist('slot-forward-root.hydrated');

    const cmp = root;
    const fb = cmp.querySelector('slot-fb') as HTMLElement;

    expect(cmp).toHaveTextContent('Slot content via slot');
    expect(fb).toHaveTextContent('Slot fallback via property');
    expect(fb.getAttribute('hidden')).toBe('');
    expect(fb.hidden).toBe(true);

    // Remove slotted content
    cmp.removeChild(cmp.childNodes[0]);
    await waitForChanges();

    expect(fb.getAttribute('hidden')).toBeNull();
    expect(fb.hidden).toBe(false);
  });
});
