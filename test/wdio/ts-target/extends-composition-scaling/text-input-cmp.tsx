import { Component, h, State, Element } from '@stencil/core';
import { ReactiveControllerHost } from './reactive-controller-host.js';
import { ValidationController } from './validation-controller.js';
import { FocusController } from './focus-controller.js';

@Component({
  tag: 'composition-text-input',
})
export class TextInputCmp extends ReactiveControllerHost {
  @Element() el!: HTMLElement;
  @State() value: string = '';
  @State() helperText: string = 'Enter your name';
  
  // Controllers via composition
  private validation = new ValidationController(this);
  private focus = new FocusController(this);
  
  private inputId = `text-input-${Math.random().toString(36).substr(2, 9)}`;
  private helperTextId = `${this.inputId}-helper-text`;
  private errorTextId = `${this.inputId}-error-text`;
  
  componentWillLoad() {
    super.componentWillLoad(); // Call base class to trigger controllers
    // Set up validation callback
    this.validation.setValidationCallback((val: string) => {
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
    super.componentDidLoad(); // Call base class to trigger controllers
  }
  
  disconnectedCallback() {
    super.disconnectedCallback(); // Call base class to trigger controllers
  }
  
  private handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
  };
  
  private handleFocus = () => {
    this.focus.handleFocus();
  };
  
  private handleBlur = () => {
    this.focus.handleBlur();
    this.validation.handleBlur(this.value);
  };
  
  render() {
    const focusState = this.focus.getFocusState();
    const validationState = this.validation.getValidationState();
    const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
    
    return (
      <div class="text-input-container">
        <label htmlFor={this.inputId}>Name</label>
        <input
          id={this.inputId}
          type="text"
          value={this.value}
          onInput={this.handleInput}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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

