import { Component, Method, State } from '@stencil/core';

import { MethodBase } from './method-base.js';

@Component({
  tag: 'extends-methods',
})
export class ExtendsMethods extends MethodBase {
  @State() displayValue: string = 'waiting...';

  @Method()
  async childMethod(): Promise<string> {
    this.callLog.push('childMethod');
    this.internalValue = 'childMethod called';
    this.displayValue = this.formatValue('Child');
    return 'child';
  }

  @Method()
  async overridableMethod(): Promise<string> {
    const baseResult = await super.overridableMethod();
    this.callLog.push('overridableMethod:child');
    this.internalValue = 'child override with super';
    this.displayValue = this.formatValue('Override');
    return `${baseResult}+child`;
  }

  @Method()
  async composedMethod(): Promise<string> {
    await this.baseMethod();
    this.callLog.push('composedMethod:child');
    const composed = `${this.internalValue} + child composition`;
    this.internalValue = composed;
    this.displayValue = this.formatValue('Composed');
    return composed;
  }

  @Method()
  async updateDisplay(value: string): Promise<void> {
    this.displayValue = value;
  }

  render() {
    return (
      <div>
        <h2>Method Inheritance Test</h2>
        <p class='display-value'>Display: {this.displayValue}</p>
      </div>
    );
  }
}
