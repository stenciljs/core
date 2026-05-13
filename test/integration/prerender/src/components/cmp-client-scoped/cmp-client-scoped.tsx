import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-client-scoped',
  styleUrl: 'cmp-client-scoped.css',
  encapsulation: { type: 'scoped' },
})
export class CmpClientScoped {
  render() {
    return (
      <section class='client-scoped'>
        <slot></slot>
      </section>
    );
  }
}
