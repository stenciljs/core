import { Component, h, Method } from '@stencil/core';

@Component({
  tag: 'scoped-slot-assigned-methods',
  scoped: true,
})
export class ScopedSlotAssignedMethods {
  private fbSlot: HTMLSlotElement;
  private plainSlot: HTMLSlotElement;

  @Method()
  async getSlotAssignedElements(opts?: { flatten: boolean }, getPlainSlot = false) {
    if (getPlainSlot) {
      return this.plainSlot.assignedElements(opts);
    }
    return this.fbSlot.assignedElements(opts);
  }

  @Method()
  async getSlotAssignedNodes(opts?: { flatten: boolean }, getPlainSlot = false) {
    if (getPlainSlot) {
      return this.plainSlot.assignedNodes(opts);
    }
    return this.fbSlot.assignedNodes(opts);
  }

  render() {
    return (
      <div>
        <slot ref={(s: HTMLSlotElement) => (this.fbSlot = s)}>
          <slot name="nested-slot">Fallback content</slot>
        </slot>
        <slot name="plain-slot" ref={(s: HTMLSlotElement) => (this.plainSlot = s)} />
      </div>
    );
  }
}
