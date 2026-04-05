import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-dynamic-parent',
  
  encapsulation: { type: 'scoped' },
})
export class SlotNestedDynamicParent {
  render() {
    return (
      <Host>
        <slot-nested-dynamic-child>
          <span slot='header'>Header Text</span>
          <slot />
        </slot-nested-dynamic-child>
      </Host>
    );
  }
}
