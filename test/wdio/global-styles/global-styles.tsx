import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'global-styles',
  shadow: true,
})
export class GlobalStyles {
  render() {
    return <Host>Hello World</Host>;
  }
}
