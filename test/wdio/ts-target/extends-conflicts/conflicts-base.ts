import { Prop, State, Method } from '@stencil/core';

/**
 * ConflictsBase - Base class demonstrating decorator conflicts
 * 
 * This base class provides:
 * 1. @Prop, @State, and @Method decorators that will be duplicated in component
 * 2. Non-duplicate properties/methods for comparison
 * 3. Tracking mechanism to verify which version is used
 */
export class ConflictsBase {
  // Duplicate properties that will be overridden in component
  @Prop() duplicateProp: string = 'base prop value';
  @State() duplicateState: string = 'base state value';
  
  // Non-duplicate properties for comparison
  @Prop() baseOnlyProp: string = 'base only prop value';
  @State() baseOnlyState: string = 'base only state value';
  
  // Tracking mechanism to verify which method is called
  protected methodCallLog: string[] = [];
  
  /**
   * Duplicate method that will be overridden in component
   */
  @Method()
  async duplicateMethod(): Promise<string> {
    this.methodCallLog.push('duplicateMethod:base');
    return 'base method';
  }
  
  /**
   * Non-duplicate method for comparison
   */
  @Method()
  async baseOnlyMethod(): Promise<string> {
    this.methodCallLog.push('baseOnlyMethod');
    return 'base only method';
  }
  
  /**
   * Method to get the call log for testing
   */
  @Method()
  async getMethodCallLog(): Promise<string[]> {
    return [...this.methodCallLog];
  }
  
  /**
   * Method to reset call log for testing
   */
  @Method()
  async resetMethodCallLog(): Promise<void> {
    this.methodCallLog = [];
  }
}

