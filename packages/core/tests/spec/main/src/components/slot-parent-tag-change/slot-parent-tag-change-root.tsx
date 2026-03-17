import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-parent-tag-change-root',
})
export class SlotParentTagChangeRoot {
  @Prop() element = 'p';

  render() {
    return (
      <slot-parent-tag-change element={this.element}>
        <slot></slot>
      </slot-parent-tag-change>
    );
  }
}
