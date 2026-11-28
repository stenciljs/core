import { Component, Element, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-item',
  styleUrl: 'bench-item.css',
  encapsulation: { type: 'shadow' },
})
export class BenchItem {
  @Element() el: HTMLElement;
  @Prop() label: string;
  @Prop() detail: string;
  @Prop({ reflect: true }) lines?: 'full' | 'inset' | 'none';
  @Prop({ reflect: true }) disabled = false;

  private inList = false;
  private inCard = false;

  componentWillLoad() {
    // context lookups, as design systems do to style by ancestor
    this.inList = !!this.el.closest('bench-list');
    this.inCard = !!this.el.closest('bench-card');
  }

  render() {
    return (
      <Host
        role='listitem'
        class={{
          'in-list': this.inList,
          'in-card': this.inCard,
          [`item-lines-${this.lines ?? 'full'}`]: true,
          'item-disabled': this.disabled,
        }}
      >
        <div class='item-native' part='native'>
          <slot name='start' />
          <div class='item-inner'>
            <div class='item-label'>
              {this.label && <span class='label-text'>{this.label}</span>}
              {this.detail && <span class='detail-text'>{this.detail}</span>}
              <slot />
            </div>
            <slot name='end' />
          </div>
          <bench-ripple />
        </div>
      </Host>
    );
  }
}
