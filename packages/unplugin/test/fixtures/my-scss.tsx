import { Component, h } from '@stencil/core';

@Component({ tag: 'my-scss', styleUrl: 'my-scss.scss', encapsulation: { type: 'shadow' } })
export class MyScss {
  render() {
    return <div class='box'>SCSS Styled</div>;
  }
}
