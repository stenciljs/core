import { Component, h, Prop, State, Method, Watch, Event, EventEmitter } from '@stencil/core';

class MixinParent {
  @Event() myEvent: EventEmitter<string>;

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
}

class Mixin extends MixinParent {
  @Prop() prop1: string = 'ExtendedCmp text';
  @Watch('prop1')
  prop1Changed(newValue: string) {
    console.info('extended class handler prop1:', newValue);
  }
}

@Component({
  tag: 'extends-local',
})
export class MixinCmp extends Mixin {
  @Prop() prop1: string = 'default text';
  @Watch('prop1')
  prop1Changed(newValue: string) {
    console.info('main class handler prop1:', newValue);
  }

  @State() state1: string = 'default state text';
  @Watch('state1')
  state1Changed(newValue: string) {
    console.info('main class handler state1:', newValue);
  }

  @Method()
  async method1() {
    this.myEvent.emit('main class method1 called');
    this.prop1 = 'main class method1 called';
  }

  render() {
    return (
      <div>
        <p class="main-prop-1">Main class prop1: {this.prop1}</p>
        <p class="main-prop-2">Main class prop2: {this.prop2}</p>
        <p class="main-state-1">Main class state1: {this.state1}</p>
        <p class="main-state-2">Main class state2: {this.state2}</p>
      </div>
    );
  }
}
