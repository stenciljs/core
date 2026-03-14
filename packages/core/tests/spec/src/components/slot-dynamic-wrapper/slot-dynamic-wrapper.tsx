import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-dynamic-wrapper',
})
export class SlotDynamicWrapper {
  @Prop() tag = 'section';

  render() {
    return (
      <this.tag>
        <slot />
      </this.tag>
    );
  }
}
