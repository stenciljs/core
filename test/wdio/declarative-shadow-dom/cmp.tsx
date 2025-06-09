import { Component, h } from '@stencil/core';

@Component({
  tag: 'dsd-cmp',
  shadow: true,
})
export class DsdComponent {
  render() {
    const env = globalThis.constructor.name === 'MockWindow' ? 'Server' : 'Client';
    return <div>I am rendered on the {env}!</div>;
  }
}
