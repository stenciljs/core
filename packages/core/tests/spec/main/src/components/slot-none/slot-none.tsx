import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-none',
})
export class SlotNone {
  render() {
    return <Host role="list"></Host>;
  }
}
