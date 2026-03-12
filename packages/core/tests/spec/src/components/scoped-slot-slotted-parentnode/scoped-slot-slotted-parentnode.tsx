import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'cmp-slotted-parentnode',
  scoped: true,
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
