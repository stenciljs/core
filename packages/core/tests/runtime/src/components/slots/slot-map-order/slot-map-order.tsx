import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-map-order',
})
export class SlotMapOrder {
  render() {
    return <slot></slot>;
  }
}
