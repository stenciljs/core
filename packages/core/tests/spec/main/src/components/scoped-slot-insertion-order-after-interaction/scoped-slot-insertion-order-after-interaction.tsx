import { Component, h, Host, State } from '@stencil/core';

@Component({
  tag: 'scoped-slot-insertion-order-after-interaction',
  scoped: true,
})
export class ScopedSlotInsertionOrderAfterInteraction {
  @State() totalCounter = 0;

  render() {
    return (
      <Host
        data-counter={this.totalCounter}
        onClick={() => {
          this.totalCounter = this.totalCounter + 1;
        }}
      >
        <slot></slot>
      </Host>
    );
  }
}
