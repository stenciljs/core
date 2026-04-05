import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'scoped-slot-content-hide',
  encapsulation: { type: 'scoped' },
})
export class ScopedSlotContentHide {
  @Prop({ mutable: true }) useSlot = false;

  render() {
    return (
      <Host>
        <p>Test Component</p>
        {this.useSlot && <slot />}
      </Host>
    );
  }
}
