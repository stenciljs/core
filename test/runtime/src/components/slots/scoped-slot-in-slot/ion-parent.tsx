import { Component, Fragment, h } from '@stencil/core';

@Component({
  tag: 'ion-parent',
  encapsulation: { type: 'scoped' },
})
export class IonParent {
  render() {
    return (
      <Fragment>
        <label>
          <slot name='label' />
        </label>
        <ion-child>
          <slot name='suffix' slot='suffix' />
        </ion-child>
        <slot name='message' />
      </Fragment>
    );
  }
}
