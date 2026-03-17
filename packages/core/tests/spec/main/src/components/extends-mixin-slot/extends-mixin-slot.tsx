import { Component, h, Mixin } from '@stencil/core';
import { SlotMixinFactory } from './slot-mixin.js';

@Component({
  tag: 'extends-mixin-slot-cmp',
})
export class MixinSlotCmp extends Mixin(SlotMixinFactory) {
  render() {
    return (
      <div class="component-root">
        <h2 class="component-title">Mixin Slot Test Component</h2>
        {this.renderContent()}
      </div>
    );
  }
}
