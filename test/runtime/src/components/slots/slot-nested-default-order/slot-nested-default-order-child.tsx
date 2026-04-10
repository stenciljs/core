import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slot-nested-default-order-child',
})
export class SlotNestedDefaultOrderChild {
  @Prop() state: boolean;

  render() {
    return (
      <Host>
        <div>State: {this.state.toString()}</div>
        <slot />
      </Host>
    );
  }
}
