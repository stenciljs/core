import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'scoped-slot-slotchange-wrap',
  scoped: true,
})
export class ScopedSlotChangeWrap {
  @Prop() swapSlotContent: boolean = false;

  render() {
    return (
      <div>
        <scoped-slot-slotchange>
          {this.swapSlotContent ? <div>Swapped slotted content</div> : <p>Initial slotted content</p>}
        </scoped-slot-slotchange>
      </div>
    );
  }
}
