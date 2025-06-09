import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-reorder',
})
export class SlotReorder {
  @Prop() reordered = false;

  render() {
    if (this.reordered) {
      return (
        <div class="reordered">
          <slot name="slot-b">
            <div>fallback slot-b</div>
          </slot>
          <slot>
            <div>fallback default</div>
          </slot>
          <slot name="slot-a">
            <div>fallback slot-a</div>
          </slot>
        </div>
      );
    }

    return (
      <div>
        <slot>
          <div>fallback default</div>
        </slot>
        <slot name="slot-a">
          <div>fallback slot-a</div>
        </slot>
        <slot name="slot-b">
          <div>fallback slot-b</div>
        </slot>
      </div>
    );
  }
}
