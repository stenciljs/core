import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'host-attr-override',
  shadow: true,
})
export class HostAttrOverride {
  render() {
    return (
      <Host class="default" role="header">
        <slot></slot>
      </Host>
    );
  }
}
