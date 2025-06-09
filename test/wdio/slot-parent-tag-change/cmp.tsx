import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-parent-tag-change',
})
export class SlotParentTagChange {
  @Prop() element = 'p';

  render() {
    return (
      <this.element>
        <slot></slot>
      </this.element>
    );
  }
}
