import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-list',
  styleUrl: 'bench-list.css',
  encapsulation: { type: 'shadow' },
})
export class BenchList {
  @Prop({ reflect: true }) inset = false;
  @Prop() lines: 'full' | 'inset' | 'none' = 'full';

  render() {
    return (
      <Host role='list' class={{ 'list-inset': this.inset, [`list-lines-${this.lines}`]: true }}>
        <slot />
      </Host>
    );
  }
}
