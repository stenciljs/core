import { Component } from '@stencil/core';

@Component({
  tag: 'ion-host',
  encapsulation: { type: 'scoped' },
})
export class IonHost {
  render() {
    return (
      <div>
        <ion-parent>
          <slot name='label' slot='label' />
          <slot name='suffix' slot='suffix' />
          <slot name='message' slot='message' />
        </ion-parent>
      </div>
    );
  }
}
