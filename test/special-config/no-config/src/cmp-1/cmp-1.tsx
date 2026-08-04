import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'cmp-one',
  encapsulation: {
    type: 'shadow',
  },
})
export class CmpOne {
  @Prop() intro = 'Default intro';

  render() {
    return <div>{this.intro}</div>;
  }
}
