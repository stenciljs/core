import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-conditional-rendering', () => {
  it('slots are not hidden', async () => {
    const { root } = await render(
      <slot-conditional-rendering>
        <span slot="header" id="slotted-header-element-id">
          Hello
        </span>
        <span id="slotted-content-element-id">World!</span>
      </slot-conditional-rendering>,
    );

    expect(root.querySelector('#slotted-header-element-id')).not.toHaveAttribute('hidden');
    expect(root.querySelector('#slotted-content-element-id')).not.toHaveAttribute('hidden');
  });

  it('header slot becomes hidden after hitting the toggle button', async () => {
    const { root, waitForChanges } = await render(
      <slot-conditional-rendering>
        <span slot="header" id="slotted-header-element-id">
          Hello
        </span>
        <span id="slotted-content-element-id">World!</span>
      </slot-conditional-rendering>,
    );

    expect(root.querySelector('#slotted-header-element-id')).not.toHaveAttribute('hidden');

    root.querySelector<HTMLButtonElement>('#header-visibility-toggle')!.click();
    await waitForChanges();

    expect(root.querySelector('#slotted-header-element-id')).toHaveAttribute('hidden');
  });

  it('content slot becomes hidden after hitting the toggle button', async () => {
    const { root, waitForChanges } = await render(
      <slot-conditional-rendering>
        <span slot="header" id="slotted-header-element-id">
          Hello
        </span>
        <span id="slotted-content-element-id">World!</span>
      </slot-conditional-rendering>,
    );

    expect(root.querySelector('#slotted-content-element-id')).not.toHaveAttribute('hidden');

    root.querySelector<HTMLButtonElement>('#content-visibility-toggle')!.click();
    await waitForChanges();

    expect(root.querySelector('#slotted-content-element-id')).toHaveAttribute('hidden');
  });
});
