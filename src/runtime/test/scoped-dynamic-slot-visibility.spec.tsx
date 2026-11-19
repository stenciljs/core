import { BUILD } from '@app-data';
import { Component, h, Host, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

/**
 * Pins the behavior introduced by #6514: for `scoped` components, content
 * without a matching slot is hidden, and toggling a slot in re-renders updates
 * that visibility. The `addSlottedNodes` change in #6934 must not affect this
 * client-only path (there, nodes never carry an `s-sn` attribute).
 */
describe('scoped dynamic slot visibility', () => {
  it('hides content without a slot and reveals it when a slot appears', async () => {
    @Component({ tag: 'dyn-slot-cmp', scoped: true })
    class DynSlotCmp {
      @Prop({ mutable: true }) useSlot = false;

      render() {
        return <Host>{this.useSlot && <slot />}</Host>;
      }
    }

    // @ts-ignore
    const page = await newSpecPage({
      components: [DynSlotCmp],
      html: `<dyn-slot-cmp use-slot="true"><div class="inside">inside</div></dyn-slot-cmp>`,
    });
    // the wdio test suite runs with extras.experimentalScopedSlotChanges: true;
    // the hide-block only executes under that flag
    (page.build as typeof BUILD).experimentalScopedSlotChanges = true;

    page.root.useSlot = false;
    await page.waitForChanges();

    const inside = page.root.querySelector('div.inside') as HTMLElement;
    expect(inside.hidden).toBe(true);

    page.root.useSlot = true;
    await page.waitForChanges();
    expect(inside.hidden).toBe(false);

    page.root.useSlot = false;
    await page.waitForChanges();
    expect(inside.hidden).toBe(true);
  });
});
