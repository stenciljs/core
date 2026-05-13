import { Component, Host } from '@stencil/core';

@Component({
  tag: 'slot-cmp',
  styles: 'slot-cmp { display: inline-block; }',
})
export class SlotCmp {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
