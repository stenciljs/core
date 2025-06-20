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

  /**
   * If `true`, the radios can be deselected.
   */
  @Prop() allowEmptySelection = false;

  /**
   * This property allows developers to specify a custom function or property
   * name for comparing objects when determining the selected option in the
   * ion-radio-group. When not specified, the default behavior will use strict
   * equality (===) for comparison.
   */
  @Prop() compareWith?: string | RadioGroupCompareFn | null;

  /**
   * The name of the control, which is submitted with the form data.
   */
  @Prop() name: string = this.inputId;

  /**
   * the value of the radio group.
   */
  @Prop({ mutable: true }) value?: any | null;

  /**
   * The helper text to display at the top of the radio group.
   */
  @Prop() helperText?: string;

  /**
   * The error text to display at the top of the radio group.
   */
  @Prop() errorText?: string;

  /**
   * Emitted when the value has changed.
   *
   * This event will not emit when programmatically setting the `value` property.
   */
  @Event() ionChange!: EventEmitter<any>;

  /**
   * Emitted when the `value` property has changed.
   * This is used to ensure that `ion-radio` can respond
   * to any value property changes from the group.
   *
   * @internal
   */
  @Event() ionValueChange!: EventEmitter<any>;


  @Watch('value')
  valueChanged(value: any | undefined) {
    this.setRadioTabindex(value);
    this.ionValueChange.emit({ value });
  }

  /**
   * Emits an `ionChange` event.
   *
   * This API should be called for user committed changes.
   * This API should not be used for external value changes.
   */
  private emitValueChange(event?: Event) {
    const { value } = this;
    this.ionChange.emit({ value, event });
  }

  private onClick = (ev: Event) => {
    ev.preventDefault();

    /**
     * The Radio Group component mandates that only one radio button
     * within the group can be selected at any given time. Since `ion-radio`
     * is a shadow DOM component, it cannot natively perform this behavior
     * using the `name` attribute.
     */
    const selectedRadio = ev.target && (ev.target as HTMLElement).closest('ion-radio');
    /**
     * Our current disabled prop definition causes Stencil to mark it
     * as optional. While this is not desired, fixing this behavior
     * in Stencil is a significant breaking change, so this effort is
     * being de-risked in STENCIL-917. Until then, we compromise
     * here by checking for falsy `disabled` values instead of strictly
     * checking `disabled === false`.
     */
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

    // Get the first radio that is not disabled and the checked one
    const first = radios.find((radio) => radio);
    const checked = radios.find((radio) => radio.value === value);

    if (!first && !checked) {
      return;
    }

    // If an enabled checked radio exists, set it to be the focusable radio
    // otherwise we default to focus the first radio
    const focusable = checked || first;

    for (const radio of radios) {
      const tabindex = radio === focusable ? 0 : -1;
      radio.setButtonTabindex(tabindex);
    }
  };

  private getRadios(): HTMLIonRadioElement[] {
    return Array.from(this.el.querySelectorAll('ion-radio'));
  }

  /**
   * Renders the helper text or error text values
   * @returns The helper text or error text values.
   */
  private renderHintText() {
    const { helperText, errorText, helperTextId, errorTextId } = this;

    const hasHintText = !!helperText || !!errorText;
    if (!hasHintText) {
      return;
    }

    return (
      <div class="radio-group-top">
        <div id={helperTextId} class="helper-text">
          {helperText}
        </div>
        <div id={errorTextId} class="error-text">
          {errorText}
        </div>
      </div>
    );
  }

  render() {
    return (
    <Host
      role="radiogroup"
      onClick={this.onClick}
    >
      {this.renderHintText()}

      {/* Change this to be wrapped in a <div> to fix the issue */}
      <slot></slot>
    </Host>
    );
  }
}

let radioGroupIds = 0;
