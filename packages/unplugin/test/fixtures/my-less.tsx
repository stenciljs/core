import { Component, h } from '@stencil/core';

@Component({ tag: 'my-less', styleUrl: 'my-less.less', encapsulation: { type: 'shadow' } })
export class MyLess {
  render() {
    return <div class='box'>LESS Styled</div>;
  }
}
