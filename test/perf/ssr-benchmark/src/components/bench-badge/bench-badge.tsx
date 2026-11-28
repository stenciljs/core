import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-badge',
  styleUrl: 'bench-badge.css',
  encapsulation: { type: 'scoped' },
})
export class BenchBadge {
  @Prop({ reflect: true }) color: 'primary' | 'success' | 'warning' = 'primary';

  render() {
    return (
      <Host class={{ [`badge-${this.color}`]: true }}>
        <span class='badge-inner'>
          <slot />
        </span>
      </Host>
    );
  }
}
