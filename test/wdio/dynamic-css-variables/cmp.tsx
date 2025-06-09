import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'dynamic-css-variable',
  styleUrl: 'cmp.css',
})
export class DynamicCssVariables {
  @State() bgColor = 'white';

  getBackgroundStyle() {
    return this.bgColor && this.bgColor !== 'white' ? { background: this.bgColor, '--font-color': 'white' } : {};
  }

  changeColor() {
    if (this.bgColor === 'white') {
      this.bgColor = 'red';
    } else {
      this.bgColor = 'white';
    }
  }

  render() {
    return [
      <header style={this.getBackgroundStyle()}>Dynamic CSS Variables!!</header>,
      <main>
        <p>
          <button onClick={this.changeColor.bind(this)}>Change Color</button>
        </p>
      </main>,
    ];
  }
}
