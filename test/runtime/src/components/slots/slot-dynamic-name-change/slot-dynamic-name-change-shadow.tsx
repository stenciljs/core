import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-dynamic-name-change-shadow',
  encapsulation: { type: 'shadow' },
})
export class SlotDynamicNameChangeShadow {
  @Prop() slotName = 'greeting';

  render() {
    return (
      <div>
        <slot name={this.slotName}></slot>
      </div>
    );
  }
}
