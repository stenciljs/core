import { Component, h, State, Element, Event, EventEmitter } from '@stencil/core';
import { FormFieldBase } from './form-field-base.js';

@Component({
  tag: 'inheritance-radio-group',
})
export class RadioGroupCmp extends FormFieldBase {
  @Element() el!: HTMLElement;
  @State() value: string | undefined = undefined;
  @State() helperText: string = 'Select an option';
  
  @Event() valueChange!: EventEmitter<string>;
  
  private inputId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  private helperTextId = `${this.inputId}-helper-text`;
  private errorTextId = `${this.inputId}-error-text`;
  
  constructor() {
    super();
    // Set up validation callback
    this.setValidationCallback((val: string | undefined) => {
      if (!val) {
        return 'Please select an option';
      }
      return undefined;
    });
  }
  
  componentDidLoad() {
    super.componentDidLoad();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  
  private handleChange = (e: Event) => {
    const radio = e.target as HTMLInputElement;
    if (radio.checked) {
      this.value = radio.value;
      this.valueChange.emit(this.value);
      this.validate(this.value);
    }
  };
  
  private onFocus = () => {
    this.handleFocusEvent();
  };
  
  private onBlur = () => {
    this.handleBlurEvent(this.value);
  };
  
  render() {
    const focusState = this.getFocusState();
    const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
    
    return (
      <div class="radio-group-container">
        <label>Select Option</label>
        <div 
          class="radio-group"
          tabindex="0"
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        >
          <label>
            <input
              type="radio"
              name={this.inputId}
              value="option1"
              checked={this.value === 'option1'}
              onChange={this.handleChange}
            />
            Option 1
          </label>
          <label>
            <input
              type="radio"
              name={this.inputId}
              value="option2"
              checked={this.value === 'option2'}
              onChange={this.handleChange}
            />
            Option 2
          </label>
          <label>
            <input
              type="radio"
              name={this.inputId}
              value="option3"
              checked={this.value === 'option3'}
              onChange={this.handleChange}
            />
            Option 3
          </label>
        </div>
        {validationData.hasError && (
          <div class="validation-message">
            <div id={validationData.errorTextId} class="error-text">
              {validationData.errorMessage}
            </div>
          </div>
        )}
        <div class="focus-info">
          Focused: {focusState.isFocused ? 'Yes' : 'No'} | 
          Focus Count: {focusState.focusCount} | 
          Blur Count: {focusState.blurCount}
        </div>
      </div>
    );
  }
}

