/**
 * ValidationControllerMixin - mixin factory for validation functionality
 * 
 * This mixin provides:
 * 1. Validation state management (isValid, errorMessage)
 * 2. Validation methods (validate, handleBlur, etc.)
 * 3. Uses forceUpdate() directly for re-renders
 */
import { State, forceUpdate } from '@stencil/core';

export const ValidationControllerMixin = (Base: any) => {
  class ValidationMixin extends Base {
    @State() protected isValid: boolean = true;
    @State() protected errorMessage: string = '';
    protected validationCallback?: (value: any) => string | undefined;
    
    // Lifecycle methods
    componentDidLoad() {
      super.componentDidLoad?.();
      this.setupValidation();
    }
    
    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.cleanupValidation();
    }
    
    protected setupValidation() {
      // Default implementation - can be extended
    }
    
    protected cleanupValidation() {
      // Default implementation - can be extended
    }
    
    // Set the validation callback from host
    setValidationCallback(callback: (value: any) => string | undefined) {
      this.validationCallback = callback;
    }
    
    // Validate the value - returns true if valid, false otherwise
    validate(value: any): boolean {
      if (!this.validationCallback) {
        this.isValid = true;
        this.errorMessage = '';
        forceUpdate(this);
        return true;
      }
      
      const error = this.validationCallback(value);
      this.isValid = !error;
      this.errorMessage = error || '';
      forceUpdate(this);
      return this.isValid;
    }
    
    // Get validation state
    getValidationState() {
      return {
        isValid: this.isValid,
        errorMessage: this.errorMessage,
      };
    }
    
    // Get validation message data for rendering
    getValidationMessageData(helperTextId?: string, errorTextId?: string) {
      const { isValid, errorMessage } = this.getValidationState();
      
      return {
        isValid,
        errorMessage,
        helperTextId,
        errorTextId,
        hasError: !!errorMessage,
      };
    }
    
    // Reset validation state
    resetValidation() {
      this.isValid = true;
      this.errorMessage = '';
      forceUpdate(this);
    }
  }
  
  return ValidationMixin;
};

