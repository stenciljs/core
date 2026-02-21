import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-client-shadow',
  styleUrl: 'cmp-client-shadow.css',
  shadow: true,
})
export class CmpClientShadow {
  render() {
    return (
      <article class="client-shadow">
        <slot></slot>
        <cmp-text-blue></cmp-text-blue>
        <cmp-text-green></cmp-text-green>
      </article>
    );
  }
}
