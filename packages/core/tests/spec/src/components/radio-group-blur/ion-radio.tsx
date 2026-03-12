import { Component, Element, Event, EventEmitter, h, Host, Method, Prop, State, Watch } from '@stencil/core';

import { addEventListener, isOptionSelected, removeEventListener } from './utils';

@Component({
  tag: 'ion-radio',
  styleUrl: 'radio.css',
  shadow: true,
})
export class Radio {
  private inputId = `ion-rb-${radioButtonIds++}`;
  private radioGroup: HTMLIonRadioGroupElement | null = null;

  @Element() el!: HTMLIonRadioElement;

  @State() checked = false;
  @State() buttonTabindex = -1;

  @Prop() name: string = this.inputId;
  @Prop() value?: any | null;

  @Watch('value')
  valueChanged() {
    this.updateState();
  }

  @Event() ionFocus!: EventEmitter<void>;
  @Event() ionBlur!: EventEmitter<void>;

  componentDidLoad() {
    this.updateState();
  }

  @Method()
  async setFocus(ev?: globalThis.Event) {
    if (ev !== undefined) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    this.el.focus();
  }

  @Method()
  async setButtonTabindex(value: number) {
    this.buttonTabindex = value;
  }

  connectedCallback() {
    if (this.value === undefined) {
      this.value = this.inputId;
    }
    const radioGroup = (this.radioGroup = this.el.closest('ion-radio-group'));
    if (radioGroup) {
      this.updateState();
      addEventListener(radioGroup, 'ionValueChange', this.updateState);
    }
  }

  disconnectedCallback() {
    const radioGroup = this.radioGroup;
    if (radioGroup) {
      removeEventListener(radioGroup, 'ionValueChange', this.updateState);
      this.radioGroup = null;
    }
  }

  private updateState = () => {
    if (this.radioGroup) {
      const { compareWith, value: radioGroupValue } = this.radioGroup;
      this.checked = isOptionSelected(radioGroupValue, this.value, compareWith);
    }
  };

  private onClick = () => {
    this.checked = true;
  };

  private onFocus = () => {
    this.ionFocus.emit();
  };

  private onBlur = () => {
    this.ionBlur.emit();
  };

  private renderRadioControl() {
    return (
      <div class="radio-icon" part="container">
        <div class="radio-inner" part="mark" />
        <div class="radio-ripple"></div>
      </div>
    );
  }

  render() {
    const { checked, buttonTabindex } = this;

    return (
      <Host
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onClick={this.onClick}
        role="radio"
        aria-checked={checked ? 'true' : 'false'}
        tabindex={buttonTabindex}
        class={{
          'radio-checked': checked,
        }}
      >
        <label class="radio-wrapper">
          <div class="label-text-wrapper">
            <slot></slot>
          </div>
          <div class="native-wrapper">{this.renderRadioControl()}</div>
        </label>
      </Host>
    );
  }
}

let radioButtonIds = 0;
