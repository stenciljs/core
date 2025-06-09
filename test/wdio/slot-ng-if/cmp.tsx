import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'slot-ng-if',
  shadow: false,
})
export class AngularSlotBinding {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
