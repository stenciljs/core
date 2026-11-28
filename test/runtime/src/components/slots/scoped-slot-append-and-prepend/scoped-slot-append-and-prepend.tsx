import { Component } from '@stencil/core';

@Component({
  tag: 'scoped-slot-append-and-prepend',
  encapsulation: { type: 'scoped' },
})
export class ScopedSlotAppendAndPrepend {
  render() {
    return (
      <div id='parentDiv' style={{ background: 'red' }}>
        Here is my slot. It is red.
        <slot></slot>
      </div>
    );
  }
}
