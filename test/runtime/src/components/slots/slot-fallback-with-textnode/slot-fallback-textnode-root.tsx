import { Component, Fragment, h, State } from '@stencil/core';

@Component({
  tag: 'slot-fallback-textnode-root',

  encapsulation: { type: 'scoped' },
})
export class SlotFallbackTextnodeRoot {
  @State() shortName: null | string;

  render() {
    return (
      <Fragment>
        <cmp-avatar-textnode>{this.shortName}</cmp-avatar-textnode>
        <button id='toggle-button' onClick={() => (this.shortName = this.shortName ? null : 'JD')}>
          Toggle ShortName
        </button>
      </Fragment>
    );
  }
}
