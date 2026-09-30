import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ssr-class-parent-cmp',
  shadow: true,
})
export class SsrClassParentCmp {
  render() {
    return (
      <Host>
        <ssr-class-child-cmp id="with-class" class={{ 'parent-set': true }} disabled>
          With a class from the parent
        </ssr-class-child-cmp>
        <ssr-class-child-cmp id="without-class" disabled>
          Without a class from the parent
        </ssr-class-child-cmp>
      </Host>
    );
  }
}
