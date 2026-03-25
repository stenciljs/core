import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'slot-array-complex-root',
})
export class SlotArrayComplexRoot {
  @State() endSlot = false;

  componentDidLoad() {
    this.endSlot = !this.endSlot;
  }

  render() {
    return (
      <main>
        <slot-array-complex>
          <header slot="start">slot - start</header>
          slot - default
          {this.endSlot ? <footer slot="end">slot - end</footer> : null}
        </slot-array-complex>
      </main>
    );
  }
}
