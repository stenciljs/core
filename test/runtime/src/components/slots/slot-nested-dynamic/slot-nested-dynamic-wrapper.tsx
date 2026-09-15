import { Component, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-dynamic-wrapper',

  encapsulation: { type: 'scoped' },
})
export class SlotNestedDynamicWrapper {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
