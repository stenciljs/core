/**
 * ValidationControllerMixin - mixin factory for validation functionality
 *
 * This mixin provides:
 * 1. Validation state management (isValid, errorMessage)
 * 2. Validation methods (validate, handleBlur, etc.)
 * 3. Uses forceUpdate() directly for re-renders
 */
import { State, forceUpdate } from '@stencil/core';

export interface ValidationControllerMixinProps {
  isValid: boolean;
  errorMessage: string;
  setValidationCallback(callback: (value: any) => string | undefined): void;
  validate(value: any): boolean;
  getValidationState(): { isValid: boolean; errorMessage: string };
  getValidationMessageData(
    helperTextId?: string,
    errorTextId?: string,
  ): {
    isValid: boolean;
    errorMessage: string;
    helperTextId?: string;
    errorTextId?: string;
    hasError: boolean;
  };
  resetValidation(): void;
}

type Ctor = new (...args: any[]) => any;
export type ValidationControllerMixinReturn<B extends Ctor> = B &
  (new (...args: any[]) => ValidationControllerMixinProps);

export const ValidationControllerMixin = <B extends Ctor>(
  Base: B,
): ValidationControllerMixinReturn<B> => {
  class ValidationMixin extends Base {
    @State() isValid: boolean = true;
    @State() errorMessage: string = '';
    #validationCallback?: (value: any) => string | undefined;

    // Lifecycle methods
    componentDidLoad() {
      super.componentDidLoad?.();
      this.setupValidation();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this.cleanupValidation();
    }

    setupValidation() {
      // Default implementation - can be extended
    }

    cleanupValidation() {
      // Default implementation - can be extended
    }

    // Set the validation callback from host
    setValidationCallback(callback: (value: any) => string | undefined) {
      this.#validationCallback = callback;
    }

    // Validate the value - returns true if valid, false otherwise
    validate(value: any): boolean {
      if (!this.#validationCallback) {
        this.isValid = true;
        this.errorMessage = '';
        forceUpdate(this);
        return true;
      }

      const error = this.#validationCallback(value);
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

  return ValidationMixin as unknown as ValidationControllerMixinReturn<B>;
};
