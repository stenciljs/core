import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'conditional-basic',
})
export class ConditionalBasic {
  @State() showContent = false;

  testClick() {
    this.showContent = !this.showContent;
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)} class="test">
          Test
        </button>
        <div class="results">{this.showContent ? 'Content' : ''}</div>
      </div>
    );
  }
}
