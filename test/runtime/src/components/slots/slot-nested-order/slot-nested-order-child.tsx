import { Component, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-order-child',
})
export class SlotNestedOrderChild {
  render() {
    return (
      <Host>
        <cmp-3>3</cmp-3>
        <i>
          <slot />
        </i>
        <cmp-5>5</cmp-5>
        <slot name='end-slot-name' />
      </Host>
    );
  }
}
