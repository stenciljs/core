/**
 * ValidationController - demonstrates validation controller via composition
 * 
 * This controller:
 * 1. Manages validation state (isValid, errorMessage)
 * 2. Provides method to get validation message data for rendering
 * 3. Can trigger validation (ideally on blur)
 * 4. Runs a callback provided by the host for validation logic
 */
import { forceUpdate } from "@stencil/core";
import type {
  ReactiveControllerHost,
  ReactiveController,
} from "./reactive-controller-host.js";

export class ValidationController implements ReactiveController {
  private host: ReactiveControllerHost;
  private isValid: boolean = true;
  private errorMessage: string = '';
  private validationCallback?: (value: any) => string | undefined;
  
  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }
  
  // Lifecycle methods
  hostDidLoad() {
    // Setup validation on component load
    this.setupValidation();
  }
  
  hostDisconnected() {
    // Cleanup if needed
    this.cleanupValidation();
  }
  
  // Setup validation - can be overridden by host
  private setupValidation() {
    // Default implementation - can be extended
  }
  
  private cleanupValidation() {
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
      forceUpdate(this.host);
      return true;
    }
    
    const error = this.validationCallback(value);
    this.isValid = !error;
    this.errorMessage = error || '';
    forceUpdate(this.host);
    return this.isValid;
  }
  
  // Trigger validation on blur
  handleBlur(value: any) {
    this.validate(value);
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
    return {
      isValid: this.isValid,
      errorMessage: this.errorMessage,
      helperTextId,
      errorTextId,
      hasError: !!this.errorMessage,
    };
  }
  
  // Reset validation state
  resetValidation() {
    this.isValid = true;
    this.errorMessage = '';
    forceUpdate(this.host);
  }
}

