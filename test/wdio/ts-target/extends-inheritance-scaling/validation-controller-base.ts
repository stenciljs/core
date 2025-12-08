/**
 * ValidationControllerBase - demonstrates validation controller via inheritance
 * 
 * This base class:
 * 1. Manages validation state (isValid, errorMessage)
 * 2. Provides method to render validation message
 * 3. Can trigger validation (ideally on blur)
 * 4. Runs a callback provided by the host for validation logic
 */
export abstract class ValidationControllerBase {
  protected isValid: boolean = true;
  protected errorMessage: string = '';
  protected validationCallback?: (value: any) => string | undefined;
  
  constructor() {}
  
  // Abstract method - host component must implement this
  // This simulates Lit's this.host.requestUpdate()
  protected abstract requestUpdate(): void;
  
  // Lifecycle methods that components can use
  componentDidLoad() {
    // Setup validation on component load
    this.setupValidation();
  }
  
  disconnectedCallback() {
    // Cleanup if needed
    this.cleanupValidation();
  }
  
  // Setup validation - can be overridden by host
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
      this.requestUpdate();
      return true;
    }
    
    const error = this.validationCallback(value);
    this.isValid = !error;
    this.errorMessage = error || '';
    this.requestUpdate();
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
    this.requestUpdate();
  }
}

