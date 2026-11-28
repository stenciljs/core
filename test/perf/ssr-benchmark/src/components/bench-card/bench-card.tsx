import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-card',
  styleUrl: 'bench-card.css',
  encapsulation: { type: 'shadow' },
})
export class BenchCard {
  @Prop() heading?: string;
  @Prop() subheading?: string;
  @Prop({ reflect: true }) elevated = true;

  render() {
    return (
      <Host class={{ 'card-elevated': this.elevated }}>
        <div class='card-header'>
          {this.heading && <h2 class='card-title'>{this.heading}</h2>}
          {this.subheading && <p class='card-subtitle'>{this.subheading}</p>}
          <slot name='header' />
        </div>
        <div class='card-content'>
          <slot />
        </div>
        <div class='card-footer'>
          <slot name='footer' />
        </div>
      </Host>
    );
  }
}
