import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'cmp-label',
  encapsulation: { type: 'scoped' },
})
export class CmpLabel {
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
