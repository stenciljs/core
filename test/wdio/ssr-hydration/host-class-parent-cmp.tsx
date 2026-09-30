import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ssr-host-class-parent',
  shadow: true,
})
export class SsrHostClassParent {
  render() {
    return (
      <Host>
        <ssr-host-class-child id="with-class" class={{ 'parent-set': true }} disabled>
          A
        </ssr-host-class-child>
        <ssr-host-class-child id="without-class" disabled>
          B
        </ssr-host-class-child>
      </Host>
    );
  }
}
