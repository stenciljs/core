import { Component, Element, h, Method, State } from '@stencil/core';

@Component({
  tag: 'attribute-boolean-root',
})
export class AttributeBooleanRoot {
  @Element() el!: HTMLElement;

  @State() state = false;

  @Method()
  async toggleState() {
    this.state = !this.state;
  }

  hostData() {
    return {
      readonly: this.state,
      tappable: this.state,
      str: this.state ? 'hello' : null,
      'aria-hidden': `${this.state}`,

      fixedtrue: 'true',
      fixedfalse: 'false',

      'no-appear': undefined as any,
      'no-appear2': false,
    };
  }

  render() {
    const AttributeBoolean = 'attribute-boolean' as any;
    return [
      <button onClick={this.toggleState.bind(this)}>Toggle attributes</button>,
      <AttributeBoolean
        boolState={this.state}
        strState={this.state as any}
        noreflect={this.state}
        tappable={this.state}
        aria-hidden={`${this.state}`}
      />,
    ];
  }
}
