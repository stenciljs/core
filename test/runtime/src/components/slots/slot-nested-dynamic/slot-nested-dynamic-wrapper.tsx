import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-dynamic-wrapper',
  shadow: false,
  scoped: true,
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
