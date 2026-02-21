import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'cmp-label-with-slot-sibling',
  scoped: true,
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
