import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'slot-parent-cmp',
})
export class SlotParentCmp {
  @Prop() label: string;

  render() {
    return (
      <Host>
        {this.label}
        <slot-cmp>
          <slot />
        </slot-cmp>
      </Host>
    );
  }
}
