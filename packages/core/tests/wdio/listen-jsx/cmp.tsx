import { Component, h, Listen, State } from '@stencil/core';

@Component({
  tag: 'listen-jsx',
  scoped: true,
  styles: `
    :host {
      background: black;
      display: block;
      color: white;
      width: 100px;
      height: 100px;
    }
  `,
})
export class AttributeBasic {
  @State() wasClicked = '';

  @Listen('click')
  onClick() {
    this.wasClicked = 'Host event';
  }
  render() {
    return <span id="result">{this.wasClicked}</span>;
  }
}
