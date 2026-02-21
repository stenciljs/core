import { Component, Fragment, h } from '@stencil/core';

@Component({
  tag: 'ion-parent',
  scoped: true,
})
export class Parent {
  render() {
    return (
      <Fragment>
        <label>
          <slot name="label" />
        </label>
        <ion-child>
          <slot name="suffix" slot="suffix" />
        </ion-child>
        <slot name="message" />
      </Fragment>
    );
  }
}
