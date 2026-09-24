import { Component, Host } from '@stencil/core';

@Component({
  tag: 'no-clonable-cmp',
  encapsulation: { type: 'shadow' },
})
export class NoClonableCmp {
  render() {
    return (
      <Host>
        <div>not clonable content</div>
      </Host>
    );
  }
}
