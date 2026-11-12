import { Component, h } from '@stencil/core';

@Component({ tag: 'my-styled', styleUrl: 'my-styled.css', encapsulation: { type: 'scoped' } })
export class MyStyled {
  render() {
    return <div class='box'>Styled Content</div>;
  }
}
