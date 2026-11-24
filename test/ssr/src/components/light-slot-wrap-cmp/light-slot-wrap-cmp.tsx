import { Component, Host } from '@stencil/core';

/** No encapsulation, with a default slot directly under the host. */
@Component({
  tag: 'light-slot-wrap-cmp',
})
export class LightSlotWrapCmp {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
