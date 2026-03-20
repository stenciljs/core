import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-child-fail',
})
export class CmpChildFail {
  render() {
    throw new Error('Child component intentionally failed to load');
  }
}
