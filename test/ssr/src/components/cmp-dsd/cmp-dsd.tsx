import { Component, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'cmp-dsd',
  styleUrl: 'cmp-dsd.css',
  shadow: true,
})
export class ComponentDSD {
  @State()
  counter = 0;

  @Prop()
  initialCounter = 0;

  render() {
    return <button onClick={() => this.counter++}>Count me: {this.initialCounter + this.counter}!</button>;
  }
}
