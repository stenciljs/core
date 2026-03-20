import { Component, h, Method, State } from '@stencil/core';

enum Foo {
  // names are explicitly different to ensure we aren't
  // just resolving the declaration name.
  BAR = 'rendered',
}

const MyProp = 'mode';

@Component({
  tag: 'computed-properties-state-decorator',
})
export class ComputedPropertiesStateDecorator {
  @State() [Foo.BAR] = false;

  @State() [MyProp] = 'default';

  @Method()
  async changeStates() {
    this.rendered = true;
    this.mode = 'super';
  }

  render() {
    return (
      <div>
        <p>Has rendered: {this.rendered.toString()}</p>
        <p>Mode: {this.mode}</p>
      </div>
    );
  }
}
