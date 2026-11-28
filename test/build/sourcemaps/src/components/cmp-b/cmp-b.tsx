import { Component } from '@stencil/core';

@Component({ tag: 'cmp-b', encapsulation: { type: 'shadow' } })
export class CmpB {
  render() {
    return <span>{'marker-cmp-b'}</span>;
  }
}
