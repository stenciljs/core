import { Component, h } from '@stencil/core';

@Component({
  tag: 'scoped-slot-connectedcallback-middle',
  shadow: false,
})
export class ScopedSlotConnectedCallbackMiddle {
  render() {
    return (
      <scoped-slot-connectedcallback-child>
        <span id="slotted-content">Slotted Content</span>
      </scoped-slot-connectedcallback-child>
    );
  }
}
