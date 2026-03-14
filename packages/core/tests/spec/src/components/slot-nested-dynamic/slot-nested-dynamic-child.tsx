import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-nested-dynamic-child',
  shadow: false,
  scoped: true,
})
export class SlotNestedDynamicChild {
  render() {
    return (
      <Host>
        <slot-nested-dynamic-wrapper id="banner">Banner notification</slot-nested-dynamic-wrapper>
        <slot name="header" />
        <slot-nested-dynamic-wrapper id="level-1">
          <slot-nested-dynamic-wrapper id="level-2">
            <slot />
          </slot-nested-dynamic-wrapper>
        </slot-nested-dynamic-wrapper>
      </Host>
    );
  }
}
