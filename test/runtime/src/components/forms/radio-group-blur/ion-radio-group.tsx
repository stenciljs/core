import { Component, Element, Event, EventEmitter, h, Host, Prop, Watch } from '@stencil/core';

export type RadioGroupCompareFn = (currentValue: any, compareValue: any) => boolean;

@Component({
  tag: 'ion-radio-group',
  styleUrl: 'radio-group.css',
})
export class TestRadioGroup {
  private inputId = `ion-rg-${radioGroupIds++}`;
  private helperTextId = `${this.inputId}-helper-text`;
  private errorTextId = `${this.inputId}-error-text`;

  @Element() el!: HTMLElement;

  @Prop() allowEmptySelection = false;
  @Prop() compareWith?: string | RadioGroupCompareFn | null;
  @Prop() name: string = this.inputId;
  @Prop({ mutable: true }) value?: any | null;
  @Prop() helperText?: string;
  @Prop() errorText?: string;

  @Event() ionChange!: EventEmitter<any>;
  @Event() ionValueChange!: EventEmitter<any>;

  @Watch('value')
  valueChanged(value: any | undefined) {
    this.setRadioTabindex(value);
    this.ionValueChange.emit({ value });
  }

  private emitValueChange(event?: Event) {
    const { value } = this;
    this.ionChange.emit({ value, event });
  }

  private onClick = (ev: Event) => {
    ev.preventDefault();
    const selectedRadio = ev.target && (ev.target as HTMLElement).closest('ion-radio');
    if (selectedRadio) {
      const currentValue = this.value;
      const newValue = selectedRadio.value;
      if (newValue !== currentValue) {
        this.value = newValue;
        this.emitValueChange(ev);
      } else if (this.allowEmptySelection) {
        this.value = undefined;
        this.emitValueChange(ev);
      }
    }
  };

  private setRadioTabindex = (value: any | undefined) => {
    const radios = this.getRadios();
    const first = radios.find((radio) => radio);
    const checked = radios.find((radio) => radio.value === value);

    if (!first && !checked) {
      return;
    }

    const focusable = checked || first;

    for (const radio of radios) {
      const tabindex = radio === focusable ? 0 : -1;
      radio.setButtonTabindex(tabindex);
    }
  };

  private getRadios(): HTMLIonRadioElement[] {
    return Array.from(this.el.querySelectorAll('ion-radio'));
  }

  private renderHintText() {
    const { helperText, errorText, helperTextId, errorTextId } = this;

    const hasHintText = !!helperText || !!errorText;
    if (!hasHintText) {
      return;
    }

    return (
      <div class='radio-group-top'>
        <div id={helperTextId} class='helper-text'>
          {helperText}
        </div>
        <div id={errorTextId} class='error-text'>
          {errorText}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Host role='radiogroup' onClick={this.onClick}>
        {this.renderHintText()}
        <slot></slot>
      </Host>
    );
  }
}

let radioGroupIds = 0;
