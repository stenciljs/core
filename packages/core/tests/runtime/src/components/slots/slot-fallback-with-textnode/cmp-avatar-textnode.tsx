import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-avatar-textnode',
  shadow: false,
  scoped: true,
})
export class CmpAvatarTextnode {
  render() {
    return (
      <div class="container">
        <slot>DEFAULT</slot>
      </div>
    );
  }
}
