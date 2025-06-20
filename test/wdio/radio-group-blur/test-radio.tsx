import { Component, Element, Event, EventEmitter, h, Host, State } from '@stencil/core';

@Component({
  tag: 'test-radio',
  shadow: true,
})
export class TestRadio {
  @Element() el: HTMLElement;
  @State() buttonTabindex = 0;

  @Event() ionFocus: EventEmitter<void>;
  @Event() ionBlur: EventEmitter<void>;

  componentDidLoad() {
    console.log('🔌 test-radio componentDidLoad');
    // Add focus/blur listeners directly to avoid Host-level issues
    this.el.addEventListener('focus', this.onFocus);
    this.el.addEventListener('blur', this.onBlur);
  }

  disconnectedCallback() {
    if (this.el) {
      this.el.removeEventListener('focus', this.onFocus);
      this.el.removeEventListener('blur', this.onBlur);
    }
  }

  private onFocus = () => {
    console.log('📡 test-radio onFocus - emitting ionFocus');
    this.ionFocus.emit();
  };

  private onBlur = () => {
    console.log('📡 test-radio onBlur - emitting ionBlur');
    this.ionBlur.emit();
  };

  render() {
    return (
      <Host tabindex={this.buttonTabindex} role="radio">
        <slot></slot>
      </Host>
    );
  }
}
