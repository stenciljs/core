import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-basic-order',
})
export class SlotBasicOrder {
  render() {
    return <slot></slot>;
  }
}
