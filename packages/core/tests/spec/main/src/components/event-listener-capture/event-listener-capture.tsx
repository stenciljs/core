import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'event-listener-capture',
})
export class EventListenerCapture {
  @State() counter = 0;

  render() {
    return (
      <div>
        <p>Click the text below to trigger a capture style event</p>
        <div>
          <p id="incrementer" onClickCapture={() => this.counter++}>
            Clicked: <span id="counter">{this.counter}</span> time(s)
          </p>
        </div>
      </div>
    );
  }
}
