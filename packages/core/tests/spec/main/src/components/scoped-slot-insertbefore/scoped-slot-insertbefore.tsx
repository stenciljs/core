import { Component, h } from '@stencil/core';

@Component({
  tag: 'scoped-slot-insertbefore',
  scoped: true,
})
export class ScopedSlotInsertBefore {
  render() {
    return (
      <div id="parentDiv">
        <div class="start-slot" style={{ background: 'red' }}>
          <div>Start slot is here:</div>
          <slot name="start-slot"></slot>
        </div>

        <div class="default-slot" style={{ background: 'green' }}>
          <div>Default slot is here:</div>
          <slot></slot>
        </div>

        <div class="end-slot" style={{ background: 'blue' }}>
          <div>End slot is here:</div>
          <slot name="end-slot"></slot>
        </div>
      </div>
    );
  }
}
