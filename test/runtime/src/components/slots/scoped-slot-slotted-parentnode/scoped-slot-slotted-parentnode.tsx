import { Component, Host } from '@stencil/core';

@Component({
  tag: 'cmp-slotted-parentnode',
  encapsulation: { type: 'scoped' },
})
export class CmpSlottedParentnode {
  render() {
    return (
      <Host>
        <label>
          <slot />
        </label>
      </Host>
    );
  }
}
