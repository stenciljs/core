import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'listen-jsx-root',
})
export class AttributeBasicRoot {
  @State() wasClicked = '';

  private onClick = () => {
    this.wasClicked = 'Parent event';
  };

  render() {
    return [<span id="result-root">{this.wasClicked}</span>, <listen-jsx onClick={this.onClick}></listen-jsx>];
  }
}
