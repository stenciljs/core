const testing = require('../../testing/index.js');

const input = `
import { Component, Prop } from '@stencil/core';
@Component({
  tag: 'my-cmp'
})
export class MyCmp {
  @Prop() prop: boolean;
}
`;

const output = testing.transpile(input);

if (output.diagnostics.length > 0) {
  const msg = output.diagnostics.map((d) => d.messageText).join('\n');
  throw new Error('Testing transpile error: \n' + msg);
}

console.log(`🐠  Validated testing suite`);
