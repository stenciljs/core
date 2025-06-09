import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-avatar',
  shadow: false,
  scoped: true,
})
export class CmpAvatar {
  render() {
    return (
      <div class="container">
        <slot>DEFAULT</slot>
      </div>
    );
  }
}
