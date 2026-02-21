import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-b',
  shadow: true,
})
export class CmpB {
  render() {
    return <slot></slot>;
  }
}
