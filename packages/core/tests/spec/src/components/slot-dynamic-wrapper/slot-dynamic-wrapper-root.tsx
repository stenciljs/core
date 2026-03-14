import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'slot-dynamic-wrapper-root',
})
export class SlotDynamicWrapperRoot {
  @State() tag = 'section';

  changeWrapper() {
    if (this.tag === 'section') {
      this.tag = 'article';
    } else {
      this.tag = 'section';
    }
  }

  render() {
    return [
      <button onClick={this.changeWrapper.bind(this)}>Change Wrapper</button>,
      <slot-dynamic-wrapper tag={this.tag} class="results1">
        <h1>parent text</h1>
      </slot-dynamic-wrapper>,
    ];
  }
}
