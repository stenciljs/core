import { Component, Prop, h } from '@stencil/core';

import { BaseElement } from './base-element.js';

@Component({ tag: 'my-derived', encapsulation: { type: 'shadow' } })
export class MyDerived extends BaseElement {
  @Prop() ownProp = 'from derived';
  render() {
    return (
      <div>
        {this.baseProp} / {this.ownProp}
      </div>
    );
  }
}
