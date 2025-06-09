import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-default-order-parent',
})
export class SlotNestedDefaultOrderParent {
  render() {
    return (
      <Host>
        <div>
          <slot-nested-default-order-child state={true}>
            <slot />
          </slot-nested-default-order-child>
        </div>
      </Host>
    );
  }
}
