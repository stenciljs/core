import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'prefix-attr-root',
})
export class PrefixAttrRoot {
  @State() message = 'Hello';
  @State() count = 42;
  @State() enabled = true;
  @State() nullValue: string | null = 'not-null';
  @State() undefinedValue: string | undefined = 'defined';

  render() {
    return (
      <div>
        <h3>Testing attr: prefix in JSX</h3>
        {/* Using attr: prefix to explicitly set attributes on nested component */}
        <prefix-attr-nested
          attr:message={this.message}
          attr:count={this.count}
          attr:enabled={this.enabled}
          attr:nullValue={this.nullValue}
          attr:undefinedValue={this.undefinedValue}
        ></prefix-attr-nested>
        <button onClick={() => (this.message = 'Updated')}>Update Message</button>
        <button onClick={() => (this.count = 99)}>Update Count</button>
        <button onClick={() => (this.enabled = false)}>Disable</button>
        <button onClick={() => (this.nullValue = null)}>Set Null to String</button>
        <button onClick={() => (this.undefinedValue = undefined)}>Set Undefined to String</button>
      </div>
    );
  }
}
