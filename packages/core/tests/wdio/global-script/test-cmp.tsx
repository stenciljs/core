import { Component, h } from '@stencil/core';

@Component({
  tag: 'global-script-test-cmp',
  scoped: true,
})
export class GlobalScriptTestCmp {
  render() {
    return (
      <section>
        <div>I am rendered after {Date.now() - window.__testStart}</div>
      </section>
    );
  }
}
