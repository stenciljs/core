import { Prop, State, Method } from '@stencil/core';

/**
 * Base class with decorated properties/methods that will be duplicated
 * in the component class to test conflict resolution.
 */
export class ConflictsBase {
  // Duplicate properties that will be overridden in component
  @Prop() duplicateProp: string = 'base prop value';
  @State() duplicateState: string = 'base state value';

  // Non-duplicate properties for comparison
  @Prop() baseOnlyProp: string = 'base only prop value';
  @State() baseOnlyState: string = 'base only state value';

  // Tracking mechanism to verify which method is called
  methodCallLog: string[] = [];

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
