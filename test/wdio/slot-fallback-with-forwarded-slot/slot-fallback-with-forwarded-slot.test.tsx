import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-fallback-with-forwarded-slot', () => {
  it('renders fallback via prop', async () => {
    // @ts-expect-error - wdio complaining about missing prop
    const { $root, root } = render({
      template: () => <slot-forward-root label="Slot fallback via property"></slot-forward-root>,
    });
    await $root.$('slot-fb');
    const fb: HTMLElement = document.querySelector('slot-fb');

    expect(await $root.getText()).toBe('');
    expect(fb.textContent).toBe('Slot fallback via property');
    expect(fb.getAttribute('hidden')).toBe(null);
    expect(fb.hidden).toBe(false);

    const p = document.createElement('p');
    p.textContent = 'Slot content via slot';
    p.slot = 'label';
    root.appendChild(p);

    expect(await $root.getText()).toBe('Slot content via slot');
    expect(fb.getAttribute('hidden')).toBe('');
    expect(fb.hidden).toBe(true);
  });

  it('should hide slot-fb elements when slotted content exists', async () => {
    // @ts-expect-error - wdio complaining about missing prop
    const { $root, root } = render({
      template: () => (
        <slot-forward-root label="Slot fallback via property">
          <div slot="label">Slot content via slot</div>
        </slot-forward-root>
      ),
    });
    await $root.$('slot-fb');
    const fb: HTMLElement = document.querySelector('slot-fb');

    expect(await $root.getText()).toBe('Slot content via slot');
    expect(fb.textContent).toBe('Slot fallback via property');
    expect(fb.getAttribute('hidden')).toBe('');
    expect(fb.hidden).toBe(true);

    root.removeChild(root.childNodes[0]);

    expect(await $root.getText()).toBe('');
    expect(fb.getAttribute('hidden')).toBe(null);
    expect(fb.hidden).toBe(false);
  });
});
