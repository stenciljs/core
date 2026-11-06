import { Component, Prop, h } from '@stencil/core';

/** Scoped, with a default slot that can be removed and rendered again. */
@Component({
  tag: 'scoped-slot-toggle-cmp',
  encapsulation: { type: 'scoped' },
})
export class ScopedSlotToggleCmp {
  @Prop() showSlot = true;

  render() {
    return <div class="wrap">{this.showSlot && <slot />}</div>;
  }
}
