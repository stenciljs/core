import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'cmp-two',
  encapsulation: {
    type: 'shadow',
  },
})
export class CmpTwo {
  @Prop() intro = 'Default intro';

  render() {
    return <div>{this.intro}</div>;
  }
}
