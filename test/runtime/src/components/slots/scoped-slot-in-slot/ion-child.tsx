import { Component } from '@stencil/core';

@Component({
  tag: 'ion-child',
  encapsulation: { type: 'scoped' },
})
export class IonChild {
  render() {
    return (
      <div style={{ display: 'flex', gap: '13px' }}>
        <slot name='suffix' />
      </div>
    );
  }
}
