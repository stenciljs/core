import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'prefix-prop-root',
})
export class PrefixPropRoot {
  @State() message = 'Hello';
  @State() count = 42;
  @State() nullValue: string | null = null;
  @State() undefinedValue: string | undefined = undefined;

  render() {
    return (
      <div>
        <h3>Testing prop: prefix in JSX</h3>
        {/* Using prop: prefix to explicitly set properties (not attributes) on nested component */}
        <prefix-prop-nested
          prop:message={this.message}
          prop:count={this.count}
          prop:nullValue={this.nullValue}
          prop:undefinedValue={this.undefinedValue}
        ></prefix-prop-nested>
        <button onClick={() => (this.message = 'Updated')}>Update Message</button>
        <button onClick={() => (this.count = 99)}>Update Count</button>
        <button onClick={() => (this.nullValue = 'not-null')}>Set Null to String</button>
        <button onClick={() => (this.undefinedValue = 'defined')}>Set Undefined to String</button>
      </div>
    );
  }
}
