import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-client-shadow',
  styleUrl: 'cmp-client-shadow.css',
  encapsulation: { type: 'shadow' },
})
export class CmpClientShadow {
  render() {
    return (
      <article class='client-shadow'>
        <slot></slot>
        <cmp-text-blue></cmp-text-blue>
        <cmp-text-green></cmp-text-green>
      </article>
    );
  }
}
