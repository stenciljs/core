import { Component, h } from '@stencil/core';

@Component({
  tag: 'ion-host',
  scoped: true,
})
export class Host {
  render() {
    return (
      <div>
        <ion-parent>
          <slot name="label" slot="label" />
          <slot name="suffix" slot="suffix" />
          <slot name="message" slot="message" />
        </ion-parent>
      </div>
    );
  }
}
