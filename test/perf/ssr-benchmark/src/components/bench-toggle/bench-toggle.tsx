import { Component, Host, Prop, State } from '@stencil/core';

@Component({
  tag: 'bench-toggle',
  styleUrl: 'bench-toggle.css',
  encapsulation: { type: 'shadow' },
})
export class BenchToggle {
  @Prop({ reflect: true }) checked = false;
  @Prop({ reflect: true }) disabled = false;
  @State() activated = false;

  render() {
    return (
      <Host
        role='switch'
        aria-checked={`${this.checked}`}
        class={{ 'toggle-checked': this.checked, 'toggle-activated': this.activated }}
      >
        <label class='toggle-wrapper'>
          <span class='label-text'>
            <slot />
          </span>
          <span class='toggle-track' part='track'>
            <span class='toggle-handle' part='handle' />
          </span>
        </label>
      </Host>
    );
  }
}
