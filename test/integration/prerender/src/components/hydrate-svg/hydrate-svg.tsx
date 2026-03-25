import { Component, h } from '@stencil/core';

@Component({
  tag: 'test-svg',
  shadow: true,
})
export class TestSvg {
  render() {
    return <svg></svg>;
  }
}
