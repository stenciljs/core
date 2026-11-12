import { Component, Host } from '@stencil/core';

@Component({
  tag: 'clonable-cmp',
  encapsulation: { type: 'shadow', clonable: true },
})
export class ClonableCmp {
  render() {
    return (
      <Host>
        <div>clonable content</div>
      </Host>
    );
  }
}
