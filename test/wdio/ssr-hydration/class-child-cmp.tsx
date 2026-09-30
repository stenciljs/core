import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ssr-class-child-cmp',
  shadow: true,
})
export class SsrClassChildCmp {
  @Prop() disabled = false;

  render() {
    return (
      <Host class={{ 'child-own': true, 'child-disabled': this.disabled }}>
        <slot />
      </Host>
    );
  }
}
