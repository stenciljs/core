import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'shadow-dom-array-root',
})
export class ShadowDomArrayRoot {
  @State() values: number[] = [0];

  addValue() {
    this.values = [...this.values, this.values.length];
  }

  render() {
    return (
      <div>
        <button onClick={this.addValue.bind(this)}>Add Value</button>
        <shadow-dom-array values={this.values} class="results1" />
      </div>
    );
  }
}
