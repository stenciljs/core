import { Component, h } from '@stencil/core';

@Component({
  tag: 'exclude-component-root',
})
export class ExcludeComponentRoot {
  render() {
    return (
      <div>
        <h1>Exclude Component Test</h1>
        <p>The component below should not be defined:</p>
        <excluded-component></excluded-component>
      </div>
    );
  }
}
