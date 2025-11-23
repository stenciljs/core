import { Method } from '@stencil/core';

export class MethodBase {
  // Protected state that methods can manipulate
  protected internalValue: string = 'initial';
  protected callLog: string[] = [];

  /**
   * Base method that can be called by child components
   */
  @Method()
  async baseMethod(): Promise<string> {
    this.callLog.push('baseMethod');
    this.internalValue = 'baseMethod called';
    return 'base';
  }

  /**
   * Method that will be overridden in child, with super() call
   */
  @Method()
  async overridableMethod(): Promise<string> {
    this.callLog.push('overridableMethod:base');
    this.internalValue = 'base implementation';
    return 'base-overridable';
  }

  /**
   * Protected helper method for composition
   */
  protected formatValue(prefix: string): string {
    return `${prefix}: ${this.internalValue}`;
  }

  /**
   * Method to get the call log for testing
   */
  @Method()
  async getCallLog(): Promise<string[]> {
    return [...this.callLog];
  }

  /**
   * Method to get internal value for testing
   */
  @Method()
  async getInternalValue(): Promise<string> {
    return this.internalValue;
  }

  /**
   * Method to reset state for testing
   */
  @Method()
  async reset(): Promise<void> {
    this.internalValue = 'initial';
    this.callLog = [];
  }
}

