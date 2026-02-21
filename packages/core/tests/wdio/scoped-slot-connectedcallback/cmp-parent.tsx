import { Component, h } from '@stencil/core';

@Component({
  tag: 'scoped-slot-connectedcallback-parent',
  shadow: false,
})
export class ScopedSlotConnectedCallbackParent {
  render() {
    return <scoped-slot-connectedcallback-middle />;
  }
}
