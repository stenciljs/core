import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ssr-host-class-child',
  shadow: true,
})
export class SsrHostClassChild {
  @Prop() disabled = false;

  render() {
    return (
      <Host class={{ 'child-own': true, 'child-disabled': this.disabled }}>
        <slot />
      </Host>
    );
  }
}
