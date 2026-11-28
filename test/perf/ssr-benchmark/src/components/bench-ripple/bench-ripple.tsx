import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-ripple',
  styleUrl: 'bench-ripple.css',
  encapsulation: { type: 'shadow' },
})
export class BenchRipple {
  @Prop() unbounded = false;

  render() {
    return <Host role='presentation' class={{ unbounded: this.unbounded }} />;
  }
}
