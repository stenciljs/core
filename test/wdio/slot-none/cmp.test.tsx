import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $ } from '@wdio/globals';

describe('slot-none', () => {
  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <slot-none>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </slot-none>
      ),
    });

    await $('slot-none').waitForExist();
  });

  it('should not apply slot fixes if there are no slots', async () => {
    const slotNone = document.querySelector('slot-none');
    expect(slotNone.children).toHaveLength(3);
    expect(slotNone.children[0].tagName).toBe('LI');
    expect(slotNone.childNodes.length).toBe(3);
    expect((slotNone.childNodes[2] as HTMLElement).tagName).toBe('LI');
    expect((slotNone as any).__children).toBeFalsy();
    expect((slotNone as any).__childNodes).toBeFalsy();
  });
});
