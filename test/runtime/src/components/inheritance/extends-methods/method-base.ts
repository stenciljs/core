import { Method } from '@stencil/core';

export class MethodBase {
  protected internalValue: string = 'initial';
  protected callLog: string[] = [];

  @Method()
  async baseMethod(): Promise<string> {
    this.callLog.push('baseMethod');
    this.internalValue = 'baseMethod called';
    return 'base';
  }

  @Method()
  async overridableMethod(): Promise<string> {
    this.callLog.push('overridableMethod:base');
    this.internalValue = 'base implementation';
    return 'base-overridable';
  }

  protected formatValue(prefix: string): string {
    return `${prefix}: ${this.internalValue}`;
  }

  @Method()
  async getCallLog(): Promise<string[]> {
    return [...this.callLog];
  }

  @Method()
  async getInternalValue(): Promise<string> {
    return this.internalValue;
  }

  @Method()
  async reset(): Promise<void> {
    this.internalValue = 'initial';
    this.callLog = [];
  }
}
