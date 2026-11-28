import { Component, Element, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-button',
  styleUrl: 'bench-button.css',
  encapsulation: { type: 'shadow' },
})
export class BenchButton {
  @Element() el: HTMLElement;
  @Prop({ reflect: true }) color: 'primary' | 'secondary' | 'danger' = 'primary';
  @Prop({ reflect: true }) size: 'small' | 'default' | 'large' = 'default';
  @Prop({ reflect: true }) fill: 'solid' | 'outline' | 'clear' = 'solid';
  @Prop({ reflect: true }) disabled = false;
  @Prop() href?: string;

  render() {
    const inItem = !!this.el.closest('bench-item');
    const TagType = this.href ? 'a' : 'button';
    return (
      <Host
        class={{
          [`button-${this.color}`]: true,
          [`button-${this.size}`]: true,
          [`button-${this.fill}`]: true,
          'in-item': inItem,
          'button-disabled': this.disabled,
        }}
      >
        <TagType class='button-native' part='native' href={this.href} disabled={this.disabled}>
          <span class='button-inner'>
            <slot name='icon-only' />
            <slot name='start' />
            <slot />
            <slot name='end' />
          </span>
          <bench-ripple />
        </TagType>
      </Host>
    );
  }
}
