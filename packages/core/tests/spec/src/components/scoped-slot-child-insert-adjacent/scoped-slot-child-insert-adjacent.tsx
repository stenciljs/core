import { Component, h } from '@stencil/core';

@Component({
  tag: 'scoped-slot-child-insert-adjacent',
  scoped: true,
})
export class ScopedSlotChildInsertAdjacent {
  render() {
    return (
      <div id="parentDiv" style={{ background: 'red' }}>
        Here is my slot. It is red.
        <slot></slot>
      </div>
    );
  }
}
