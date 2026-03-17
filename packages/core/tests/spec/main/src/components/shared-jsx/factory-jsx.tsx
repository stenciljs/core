import { Component, h } from '@stencil/core';

@Component({
  tag: 'factory-jsx',
})
export class FactoryJSX {
  getJsxNode() {
    return <div>Factory JSX</div>;
  }

  render() {
    return (
      <div>
        {this.getJsxNode()}
        {this.getJsxNode()}
      </div>
    );
  }
}
