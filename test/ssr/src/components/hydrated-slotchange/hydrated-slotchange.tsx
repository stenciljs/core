import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'hydrated-slotchange',
  encapsulation: { type: 'scoped' },
})
export class HydratedSlotchange {
  /** The number of assigned elements at each `slotchange`. */
  @Prop({ mutable: true }) slotchanges: number[] = [];

  private handleSlotchange = (ev: Event) => {
    this.slotchanges.push((ev.target as HTMLSlotElement).assignedElements().length);
  };

  render() {
    return (
      <div>
        <slot onSlotchange={this.handleSlotchange} />
      </div>
    );
  }
}
