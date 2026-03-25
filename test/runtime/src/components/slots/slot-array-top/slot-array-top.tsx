import { Component, h } from '@stencil/core';

@Component({
  tag: 'slot-array-top',
  shadow: true,
})
export class SlotArrayTop {
  render() {
    return [<span>Content should be on top</span>, <slot />];
  }
}
