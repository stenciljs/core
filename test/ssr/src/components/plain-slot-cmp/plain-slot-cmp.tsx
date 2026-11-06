import { Component, h } from '@stencil/core';

/** No encapsulation, with a default slot. */
@Component({
  tag: 'plain-slot-cmp',
})
export class PlainSlotCmp {
  render() {
    return (
      <p class='plain-slot'>
        <slot />
      </p>
    );
  }
}
