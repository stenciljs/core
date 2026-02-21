import { Component, Fragment, h, State } from '@stencil/core';

@Component({
  tag: 'my-component',
  shadow: false,
  scoped: true,
})
export class MyComponent {
  @State() shortName: null | string;

  render() {
    return (
      <Fragment>
        <cmp-avatar>{this.shortName}</cmp-avatar>
        <button id="toggle-button" onClick={() => (this.shortName = this.shortName ? null : 'JD')}>
          Toggle ShortName
        </button>
      </Fragment>
    );
  }
}
