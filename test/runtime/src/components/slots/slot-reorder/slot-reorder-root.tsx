import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'slot-reorder-root',
})
export class SlotReorderRoot {
  @State() reordered = false;

  testClick() {
    this.reordered = !this.reordered;
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)} class="test">
          Test
        </button>

        <slot-reorder class="results1" reordered={this.reordered}></slot-reorder>

        <hr />

        <slot-reorder class="results2" reordered={this.reordered}>
          <div>default content</div>
        </slot-reorder>

        <hr />

        <slot-reorder class="results3" reordered={this.reordered}>
          <div slot="slot-b">slot-b content</div>
          <div>default content</div>
          <div slot="slot-a">slot-a content</div>
        </slot-reorder>

        <hr />

        <slot-reorder class="results4" reordered={this.reordered}>
          <div slot="slot-b">slot-b content</div>
          <div slot="slot-a">slot-a content</div>
          <div>default content</div>
        </slot-reorder>
      </div>
    );
  }
}
