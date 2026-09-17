import { Component, Host } from '@stencil/core';

@Component({
  tag: 'serializable-cmp',
  encapsulation: { type: 'shadow', serializable: true },
})
export class SerializableCmp {
  render() {
    return (
      <Host>
        <div>serializable content</div>
      </Host>
    );
  }
}
