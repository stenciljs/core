import { Component } from '@stencil/core';

@Component({
  tag: 'cmp-a',
  globalStyleUrl: './cmp-a.global.css',
})
export class CmpA {
  render() {
    return <slot />;
  }
}
