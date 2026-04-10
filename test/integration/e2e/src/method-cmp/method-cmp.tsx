import { Component, Method, Prop } from '@stencil/core';

@Component({
  tag: 'method-cmp',
})
export class MethodCmp {
  @Prop() someProp = 0;

  /**
   * this is some method
   * @returns {number} some number
   */
  @Method()
  async someMethod() {
    return this.someProp;
  }

  /**
   * this is some method with args
   * @param unit some unit
   * @param value some value
   * @returns {string} some string
   */
  @Method()
  async someMethodWithArgs(unit: string, value: number) {
    return `${value} ${unit}`;
  }
}
