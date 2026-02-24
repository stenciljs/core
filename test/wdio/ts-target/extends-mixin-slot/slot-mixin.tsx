import { h } from '@stencil/core';

/**
 * A mixin that provides a renderContent method containing a slot.
 * This tests that Stencil properly walks into mixin factory functions
 * to detect slot elements for build conditionals.
 */
export const SlotMixinFactory = <T extends new (...args: any[]) => {}>(Base: T) => {
  class SlotMixin extends Base {
    renderContent = () => (
      <div class="mixin-wrapper">
        <div class="mixin-header">Mixin Content Header</div>
        <slot name="content" />
        <div class="mixin-footer">Mixin Content Footer</div>
      </div>
    );
  }
  return SlotMixin;
};
