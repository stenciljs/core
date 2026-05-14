import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-b',
  globalStyle: 'cmp-b { display: inline-block; }',
})
export class CmpB {
  render() {
    return <slot />;
  }
}
