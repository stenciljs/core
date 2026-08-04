import { Component } from '@stencil/core';

@Component({
  tag: 'non-shadow-multi-slots',
  encapsulation: { type: 'scoped' },
})
export class NonShadowMultiSlots {
  render() {
    return [
      <div>Internal: BEFORE DEFAULT SLOT</div>,
      <slot />,
      <div>Internal: AFTER DEFAULT SLOT</div>,
      <div>Internal: BEFORE SECOND SLOT</div>,
      <slot name='second-slot'>Second slot fallback text</slot>,
      <div>Internal: AFTER SECOND SLOT</div>,
    ];
  }
}
