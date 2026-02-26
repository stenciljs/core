import { Component, h, Mixin } from '@stencil/core';
import { SiblingMixinFactory } from './mixin-factory.js';

/**
 * A component that uses a mixin factory pattern internally.
 * This tests the scenario where a consumer project imports and renders a component
 * from an external library, and that component internally uses a mixin pattern.
 * The mixin's decorated members should be properly merged and reactive.
 *
 * Used as the extendedTag in tests - renders `.extended-*` elements with mixin defaults.
 */
@Component({
  tag: 'sibling-with-mixin',
})
export class SiblingWithMixin extends Mixin(SiblingMixinFactory) {
  render() {
    return (
      <div>
        <p class="extended-prop-1">Extended class prop 1: {this.prop1}</p>
        <p class="extended-prop-2">Extended class prop 2: {this.prop2}</p>
        <p class="extended-state-1">Extended class state 1: {this.state1}</p>
        <p class="extended-state-2">Extended class state 2: {this.state2}</p>
      </div>
    );
  }
}
