import { Component, Host } from '@stencil/core';

@Component({
  tag: 'no-serializable-cmp',
  encapsulation: { type: 'shadow' },
})
export class NoSerializableCmp {
  render() {
    return (
      <Host>
        <div>not serializable content</div>
      </Host>
    );
  }
}
