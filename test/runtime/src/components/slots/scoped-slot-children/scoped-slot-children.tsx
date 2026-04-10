import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'scoped-slot-children',
  encapsulation: { type: 'scoped' },
})
export class ScopedSlotChildren {
  render() {
    return (
      <Host>
        <p>internal text 1</p>
        <slot name='second-slot' />
        <div>
          <slot>This is fallback text</slot>
        </div>
        <p>internal text 2</p>
      </Host>
    );
  }
}
