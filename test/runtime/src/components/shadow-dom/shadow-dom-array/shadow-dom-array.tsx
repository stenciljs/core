import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'shadow-dom-array',
  encapsulation: { type: 'shadow' },
})
export class ShadowDomArray {
  @Prop() values: number[] = [];

  render() {
    return this.values.map((v) => <div>{v}</div>);
  }
}
