import { Component, h } from '@stencil/core';

@Component({
  tag: 'scoped-slot-connectedcallback-parent',
  
})
export class ScopedSlotConnectedCallbackParent {
  render() {
    return <scoped-slot-connectedcallback-middle />;
  }
}
