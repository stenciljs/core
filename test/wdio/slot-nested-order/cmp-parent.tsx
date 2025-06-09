import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-order-parent',
  shadow: false,
})
export class SlotNestedOrderParent {
  render() {
    return (
      <Host>
        <slot />
        <slot-nested-order-child>
          <slot name="italic-slot-name" />
          <cmp-6 slot="end-slot-name">6</cmp-6>
        </slot-nested-order-child>
      </Host>
    );
  }
}
