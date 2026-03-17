import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'ref-attr-order',
  shadow: true,
})
export class RefAttrOrder {
  @State() index: number = -1;

  // order matters for the attributes in the test below!
  //
  // this is testing that even though the `ref` attribute is declared first in
  // the JSX for the `div` the `ref` callback will nonetheless be called after
  // the `tabIndex` attribute is applied to the element.
  // See https://github.com/stenciljs/core/issues/4074
  render() {
    return (
      <div
        ref={(el) => {
          if (el) {
            this.index = el.tabIndex;
          }
        }}
        tabIndex={0}
      >
        my tabIndex: {this.index}
      </div>
    );
  }
}
