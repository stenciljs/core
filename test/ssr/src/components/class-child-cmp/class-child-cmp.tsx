import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ssr-class-child-cmp',
  encapsulation: { type: 'shadow' },
})
export class SsrClassChildCmp {
  @Prop() disabled = false;
  /** `disabled` as seen by the first client render - `false` means it hydrated before its parent */
  initialDisabled?: boolean;

  componentWillLoad() {
    this.initialDisabled = this.disabled;
  }

  render() {
    return (
      <Host class={{ 'child-own': true, 'child-disabled': this.disabled }}>
        <slot />
      </Host>
    );
  }
}
