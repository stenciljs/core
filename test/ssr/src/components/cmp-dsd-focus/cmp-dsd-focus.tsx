import { Component, Host } from '@stencil/core';

@Component({
  tag: 'cmp-dsd-focus',
  encapsulation: { type: 'shadow', delegatesFocus: true },
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
