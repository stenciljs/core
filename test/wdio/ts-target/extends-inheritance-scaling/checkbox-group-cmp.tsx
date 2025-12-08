import { Component, h, State, Element, Event, EventEmitter } from '@stencil/core';
import { FormFieldBase } from './form-field-base.js';

@Component({
  tag: 'inheritance-checkbox-group',
})
export class CheckboxGroupCmp extends FormFieldBase {
  @Element() el!: HTMLElement;
  @State() values: string[] = [];
  @State() helperText: string = 'Select at least one option';
  
  @Event() valueChange!: EventEmitter<string[]>;
  
  private inputId = `checkbox-group-${Math.random().toString(36).substr(2, 9)}`;
  private helperTextId = `${this.inputId}-helper-text`;
  private errorTextId = `${this.inputId}-error-text`;
  
  constructor() {
    super();
    // Set up validation callback
    this.setValidationCallback((vals: string[]) => {
      if (!vals || vals.length === 0) {
        return 'Please select at least one option';
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
    const checkbox = e.target as HTMLInputElement;
    const value = checkbox.value;
    
    if (checkbox.checked) {
      this.values = [...this.values, value];
    } else {
      this.values = this.values.filter(v => v !== value);
    }
    
    this.valueChange.emit(this.values);
    this.validate(this.values);
  };
  
  private onFocus = () => {
    this.handleFocusEvent();
  };
  
  private onBlur = () => {
    this.handleBlurEvent(this.values);
  };
  
  render() {
    const focusState = this.getFocusState();
    const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
    
    return (
      <div class="checkbox-group-container">
        <label>Select Options</label>
        <div 
          class="checkbox-group"
          tabindex="0"
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        >
          <label>
            <input
              type="checkbox"
              name={this.inputId}
              value="option1"
              checked={this.values.includes('option1')}
              onChange={this.handleChange}
            />
            Option 1
          </label>
          <label>
            <input
              type="checkbox"
              name={this.inputId}
              value="option2"
              checked={this.values.includes('option2')}
              onChange={this.handleChange}
            />
            Option 2
          </label>
          <label>
            <input
              type="checkbox"
              name={this.inputId}
              value="option3"
              checked={this.values.includes('option3')}
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

