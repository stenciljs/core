import { Component, h, Method, State } from '@stencil/core';
import { MethodBase } from './method-base.js';

@Component({
  tag: 'extends-methods',
})
export class MethodsCmp extends MethodBase {
  
  @State() displayValue: string = 'waiting...';

  /**
   * Child-specific method that uses parent's protected helper
   */
  @Method()
  async childMethod(): Promise<string> {
    this.callLog.push('childMethod');
    this.internalValue = 'childMethod called';
    this.displayValue = this.formatValue('Child');
    return 'child';
  }

  /**
   * Override parent method with super() call
   */
  @Method()
  async overridableMethod(): Promise<string> {
    // Call parent implementation
    const baseResult = await super.overridableMethod();
    
    // Add child behavior
    this.callLog.push('overridableMethod:child');
    this.internalValue = 'child override with super';
    this.displayValue = this.formatValue('Override');
    
    return `${baseResult}+child`;
  }

  /**
   * Method that composes parent and child behavior
   */
  @Method()
  async composedMethod(): Promise<string> {
    // Call parent method
    await this.baseMethod();
    
    // Add child behavior
    this.callLog.push('composedMethod:child');
    const composed = `${this.internalValue} + child composition`;
    this.internalValue = composed;
    this.displayValue = this.formatValue('Composed');
    
    return composed;
  }

  /**
   * Method to trigger display update from test
   */
  @Method()
  async updateDisplay(value: string): Promise<void> {
    this.displayValue = value;
  }

  render() {
    return (
      <div>
        <h2>Method Inheritance Test</h2>
        <p class="display-value">Display: {this.displayValue}</p>
        
        <div class="info">
          <p class="test-info">Test @Method inheritance, super() calls, and method composition</p>
          <p class="features">
            Features: @Method inheritance | super() calls | Method override | Protected helpers
          </p>
        </div>
      </div>
    );
  }
}

