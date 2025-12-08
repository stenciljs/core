import { Prop, State, Method } from '@stencil/core';

/**
 * MixedDecoratorsBase - Base class demonstrating mixed decorator type conflicts
 * 
 * This base class provides:
 * 1. @Prop, @State, and @Method decorators that will conflict with different decorator types in component
 * 2. Non-conflicting properties/methods for comparison
 * 3. Tracking mechanism to verify which version is used
 */
export class MixedDecoratorsBase {
  // Properties that will conflict with different decorator types in component
  @Prop() mixedName: string = 'base prop value';
  @State() mixedStateName: string = 'base state value';
  
  // Non-conflicting properties for comparison
  @Prop() baseOnlyProp: string = 'base only prop value';
  @State() baseOnlyState: string = 'base only state value';
  
  // Tracking mechanism to verify which method is called
  protected methodCallLog: string[] = [];
  
  /**
   * Method that will conflict with @Prop in component
   */
  @Method()
  async mixedMethodName(): Promise<string> {
    this.methodCallLog.push('mixedMethodName:base');
    return 'base method';
  }
  
  /**
   * Non-conflicting method for comparison
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

