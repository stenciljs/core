import { Component, getMode, h } from '@stencil/core';

// Per-mode `styles` is required to exercise the `computeMode` path at all -
// see `initialize-component.ts`, which only calls `computeMode` when the
// component has a non-string `style` getter (i.e. mode-keyed styles).
@Component({
  tag: 'my-mode',
  encapsulation: { type: 'shadow' },
  styles: { md: ':host{}', ios: ':host{}' },
})
export class MyMode {
  render() {
    return <div>{getMode(this)}</div>;
  }
}
