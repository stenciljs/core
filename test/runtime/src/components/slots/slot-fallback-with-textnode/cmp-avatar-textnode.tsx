import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-avatar-textnode',

  encapsulation: { type: 'scoped' },
})
export class CmpAvatarTextnode {
  render() {
    return (
      <div class='container'>
        <slot>DEFAULT</slot>
      </div>
    );
  }
}
