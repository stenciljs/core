import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'scoped-slot-inner-content',
  encapsulation: { type: 'scoped' },
})
export class ScopedSlotInnerContent {
  @Prop() count = 0;

  render() {
    return (
      <div class='wrap'>
        <span class='count'>{this.count}</span>
        <slot />
      </div>
    );
  }
}
