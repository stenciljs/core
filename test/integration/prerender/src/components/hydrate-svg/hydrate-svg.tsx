import { Component, h } from '@stencil/core';

@Component({
  tag: 'test-svg',
  encapsulation: { type: 'shadow' },
})
export class TestSvg {
  render() {
    return <svg></svg>;
  }
}
