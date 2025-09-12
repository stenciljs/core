import { Component, h, Prop, State, Method, Watch } from '@stencil/core';

@Component({
  tag: 'sibling-extended-base',
})
export class SiblingExtendedBase {
  @Prop() prop1: string = 'ExtendedCmp text';
  @Watch('prop1')
  prop1Changed(newValue: string) {
    console.info('extended class handler prop1:', newValue);
  }
  @Prop() prop2: string = 'ExtendedCmp prop2 text';
  @Watch('prop2')
  prop2Changed(newValue: string) {
    console.info('extended class handler prop2:', newValue);
  }

  @State() state1: string = 'ExtendedCmp state text';
  @Watch('state1')
  state1Changed(newValue: string) {
    console.info('extended class handler state1:', newValue);
  }
  @State() state2: string = 'ExtendedCmp state2 text';
  @Watch('state2')
  state2Changed(newValue: string) {
    console.info('extended class handler state2:', newValue);
  }

  @Method()
  async method1() {
    this.prop1 = 'ExtendedCmp method1 called';
  }

  @Method()
  async method2() {
    this.prop1 = 'ExtendedCmp method2 called';
  }

  render() {
    return (
      <div>
        <p class="extended-prop-1">Base Extended class prop 1: {this.prop1}</p>
        <p class="extended-prop-2">Base Extended class prop 2: {this.prop2}</p>
        <p class="extended-state-1">Base Extended class state 1: {this.state1}</p>
        <p class="extended-state-2">Base Extended class state 2: {this.state2}</p>
      </div>
    );
  }
}
