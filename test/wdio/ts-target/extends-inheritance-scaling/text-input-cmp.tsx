import { Component, h, State, Element } from '@stencil/core';
import { FormFieldBase } from './form-field-base.js';

@Component({
  tag: 'inheritance-text-input',
})
export class TextInputCmp extends FormFieldBase {
  @Element() el!: HTMLElement;
  @State() value: string = '';
  @State() helperText: string = 'Enter your name';
  
  private inputId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
  private helperTextId = `${this.inputId}-helper-text`;
  private errorTextId = `${this.inputId}-error-text`;
  
  constructor() {
    super();
    // Set up validation callback
    this.setValidationCallback((val: string) => {
      if (!val || val.trim().length === 0) {
        return 'Name is required';
      }
      if (val.length < 2) {
        return 'Name must be at least 2 characters';
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
  
  private handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
  };
  
  private onFocus = () => {
    this.handleFocusEvent();
  };
  
  private onBlur = () => {
    this.handleBlurEvent(this.value);
  };
  
  render() {
    const focusState = this.getFocusState();
    const validationState = this.getValidationState();
    const validationData = this.getValidationMessageData(this.helperTextId, this.errorTextId);
    
    return (
      <div class="text-input-container">
        <label htmlFor={this.inputId}>Name</label>
        <input
          id={this.inputId}
          type="text"
          value={this.value}
          onInput={this.handleInput}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          class={validationState.isValid ? '' : 'invalid'}
        />
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

