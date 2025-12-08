import { Component, h, State, Element, Event, EventEmitter } from '@stencil/core';
import { ReactiveControllerHost } from './reactive-controller-host.js';
import { ValidationController } from './validation-controller.js';
import { FocusController } from './focus-controller.js';

@Component({
  tag: 'composition-checkbox-group',
})
export class CheckboxGroupCmp extends ReactiveControllerHost {
  @Element() el!: HTMLElement;
  @State() values: string[] = [];
  @State() helperText: string = 'Select at least one option';
  
  @Event() valueChange!: EventEmitter<string[]>;
  
  // Controllers via composition
  private validation = new ValidationController(this);
  private focus = new FocusController(this);
  
  private inputId = `checkbox-group-${Math.random().toString(36).substr(2, 9)}`;
  private helperTextId = `${this.inputId}-helper-text`;
  private errorTextId = `${this.inputId}-error-text`;
  
  componentWillLoad() {
    super.componentWillLoad(); // Call base class to trigger controllers
    // Set up validation callback
    this.validation.setValidationCallback((vals: string[]) => {
      if (!vals || vals.length === 0) {
        return 'Please select at least one option';
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
  
  private handleChange = (e: Event) => {
    const checkbox = e.target as HTMLInputElement;
    const value = checkbox.value;
    
    if (checkbox.checked) {
      this.values = [...this.values, value];
    } else {
      this.values = this.values.filter(v => v !== value);
    }
    
    this.valueChange.emit(this.values);
    this.validation.validate(this.values);
  };
  
  private handleFocus = () => {
    this.focus.handleFocus();
  };
  
  private handleBlur = () => {
    this.focus.handleBlur();
    this.validation.handleBlur(this.values);
  };
  
  render() {
    const focusState = this.focus.getFocusState();
    const validationData = this.validation.getValidationMessageData(this.helperTextId, this.errorTextId);
    
    return (
      <div class="checkbox-group-container">
        <label>Select Options</label>
        <div 
          class="checkbox-group"
          tabindex="0"
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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

