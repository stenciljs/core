import { Component, Host } from '@stencil/core';

@Component({
  tag: 'global-styles',
  encapsulation: { type: 'shadow' },
})
export class GlobalStyles {
  render() {
    return <Host>Hello World</Host>;
  }
}
