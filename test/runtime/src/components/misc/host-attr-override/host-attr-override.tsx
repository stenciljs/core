import { Component, Host } from '@stencil/core';

@Component({
  tag: 'host-attr-override',
  encapsulation: { type: 'shadow' },
})
export class HostAttrOverride {
  render() {
    return (
      <Host class='default' role='header'>
        <slot></slot>
      </Host>
    );
  }
}
