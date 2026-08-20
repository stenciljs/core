import { Component, Prop, h } from '@stencil/core';

import { MiddleElement } from './middle-element.js';

@Component({ tag: 'my-deep-derived', encapsulation: { type: 'shadow' } })
export class MyDeepDerived extends MiddleElement {
  @Prop() deepProp = 'from deep';

  render() {
    return (
      <div>
        {this.middleProp} / {this.deepProp}
      </div>
    );
  }
}
