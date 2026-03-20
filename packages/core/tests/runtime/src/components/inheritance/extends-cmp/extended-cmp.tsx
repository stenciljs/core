import { Component, h } from '@stencil/core';
import { ExtendedCmpCmp } from './extended-cmp-cmp.js';

@Component({
  tag: 'extended-cmp',
})
export class ExtendedCmp extends ExtendedCmpCmp {
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
