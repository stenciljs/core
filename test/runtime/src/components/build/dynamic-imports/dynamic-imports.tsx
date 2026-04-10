import { Component, h, Method, State } from '@stencil/core';

@Component({
  tag: 'dynamic-import',
})
export class DynamicImport {
  @State() value?: string;

  async componentWillLoad() {
    await this.update();
  }

  async getResult() {
    return (await import('./module1.js')).getResult();
  }

  @Method()
  async update() {
    this.value = await this.getResult();
  }

  render() {
    return <div>{this.value}</div>;
  }
}
