import { Component, Host } from '@stencil/core';

@Component({
  tag: 'cmp-label-with-slot-sibling',
  encapsulation: { type: 'scoped' },
})
export class CmpLabelWithSlotSibling {
  render() {
    return (
      <Host>
        <label>
          <slot />
          <div>Non-slotted text</div>
        </label>
      </Host>
    );
  }
}
