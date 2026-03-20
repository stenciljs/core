import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'cmp-dsd-focus',
  shadow: { delegatesFocus: true },
})
export class ComponentDSDWithFocusDelegation {
  render() {
    return (
      <Host>
        <div>Clickable shadow DOM text</div>
        <button>Click me!</button>
      </Host>
    );
  }
}
