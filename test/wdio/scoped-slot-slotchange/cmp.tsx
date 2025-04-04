import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'scoped-slot-slotchange',
  scoped: true,
})
export class ScopedSlotChange {
  @Prop({ mutable: true }) slotEventCatch: { event: Event; assignedNodes: Node[] }[] = [];

  private handleSlotchange = (e: Event) => {
    this.slotEventCatch.push({
      event: e,
      assignedNodes: (e as Event & { target: HTMLSlotElement }).target.assignedNodes(),
    });
  };

  render() {
    return (
      <div>
        <slot onSlotchange={this.handleSlotchange} />
        <slot name="fallback-slot" onSlotchange={this.handleSlotchange}>
          Slot with fallback
        </slot>
      </div>
    );
  }
}
