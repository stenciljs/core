import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'empty-cmp-shadow',
  shadow: true,
})
export class EmptyComponentShadow {
  render() {
    return <Host>I have no children!</Host>;
  }
}
