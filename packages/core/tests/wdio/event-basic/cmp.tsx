import { Component, Event, EventEmitter, h, Listen, State } from '@stencil/core';

@Component({
  tag: 'event-basic',
})
export class EventBasic {
  @Event() testEvent: EventEmitter;

  @State() counter = 0;

  @Listen('testEvent')
  testEventHandler() {
    this.counter++;
  }

  componentDidLoad() {
    this.testEvent.emit();
  }

  render() {
    return (
      <div>
        <p>testEvent is emitted on componentDidLoad</p>
        <div>
          <p>
            Emission count: <span id="counter">{this.counter}</span>
          </p>
        </div>
      </div>
    );
  }
}
