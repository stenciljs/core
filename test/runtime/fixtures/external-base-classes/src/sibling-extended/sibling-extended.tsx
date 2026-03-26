import { Component, h } from '@stencil/core';
import { SiblingExtendedBase } from '../sibling-extended-base/sibling-extended-base.js';

@Component({
  tag: 'sibling-extended',
})
export class SiblingExtended extends SiblingExtendedBase {
  render() {
    return (
      <div>
        <p class='extended-prop-1'>Extended class prop 1: {this.prop1}</p>
        <p class='extended-prop-2'>Extended class prop 2: {this.prop2}</p>
        <p class='extended-state-1'>Extended class state 1: {this.state1}</p>
        <p class='extended-state-2'>Extended class state 2: {this.state2}</p>
      </div>
    );
  }
}
