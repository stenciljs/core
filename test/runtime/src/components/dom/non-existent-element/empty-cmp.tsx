import { Component, Host } from '@stencil/core';

@Component({
  tag: 'empty-cmp',
})
export class EmptyComponent {
  render() {
    return <Host>I have no children!</Host>;
  }
}
