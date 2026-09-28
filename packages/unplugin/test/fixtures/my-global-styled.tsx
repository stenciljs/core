import { Component, h } from '@stencil/core';

@Component({ tag: 'my-global-styled', globalStyle: 'my-global-styled { display: block; }' })
export class MyGlobalStyled {
  render() {
    return <slot />;
  }
}
