import { Component, h } from '@stencil/core';

@Component({
  tag: 'shadow-dom-basic-root',
  styles: `
    div {
      background: rgb(255, 255, 0);
    }
  `,
  shadow: true,
})
export class ShadowDomBasicRoot {
  render() {
    return (
      <shadow-dom-basic>
        <div>light</div>
      </shadow-dom-basic>
    );
  }
}
