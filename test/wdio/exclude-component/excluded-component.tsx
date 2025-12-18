import { Component, h } from '@stencil/core';

@Component({
  tag: 'excluded-component',
})
export class ExcludedComponent {
  render() {
    return <div class="excluded-content">This component should be excluded from the build</div>;
  }
}
