import { Component, h } from '@stencil/core';

@Component({
  tag: 'reference-target-cmp',
  encapsulation: { type: 'shadow', referenceTarget: 'inner-input' },
})
export class ReferenceTargetCmp {
  render() {
    return (
      <div>
        <input id='inner-input' />
      </div>
    );
  }
}
