import { Component, h } from '@stencil/core';

@Component({
  tag: 'ion-child',
  scoped: true,
})
export class Child {
  render() {
    return (
      <div style={{ display: 'flex', gap: '13px' }}>
        <slot name="suffix" />
      </div>
    );
  }
}
