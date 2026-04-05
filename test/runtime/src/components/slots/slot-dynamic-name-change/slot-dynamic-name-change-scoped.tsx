import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-dynamic-name-change-scoped',
  encapsulation: { type: 'scoped' },
})
export class SlotDynamicNameChangeScoped {
  @Prop() slotName = 'greeting';

  render() {
    return (
      <div>
        <slot name={this.slotName}></slot>
      </div>
    );
  }
}
