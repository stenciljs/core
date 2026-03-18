import { Component, h } from '@stencil/core';

@Component({
  tag: 'cmp-server-vs-client',
  shadow: true,
})
export class ServerVSClientCmp {
  render() {
    const winner = globalThis.constructor.name === 'MockWindow' ? 'Server' : 'Client';
    return <div>Server vs Client? Winner: {winner}</div>;
  }
}
