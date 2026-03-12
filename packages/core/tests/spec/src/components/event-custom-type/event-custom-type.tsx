import { Component, Event, EventEmitter, h, Listen, State } from '@stencil/core';

export interface TestEventDetail {
  value: string;
}

@Component({
  tag: 'event-custom-type',
})
export class EventCustomType {
  @Event() testEvent: EventEmitter<TestEventDetail>;

  @State() counter = 0;
  @State() lastEventValue: TestEventDetail;

  @Listen('testEvent')
  testEventHandler(newValue: CustomEvent<TestEventDetail>) {
    this.counter++;
    this.lastEventValue = newValue.detail;
  }

  componentDidLoad() {
    this.testEvent.emit({
      value: 'Test value',
    });
  }

  render() {
    return (
      <div>
        <p>testEvent is emitted on componentDidLoad</p>
        <div>
          <p>
            Emission count: <span id="counter">{this.counter}</span>
          </p>
          <p>
            Last emitted value: <span id="lastValue">{JSON.stringify(this.lastEventValue)}</span>
          </p>
        </div>
      </div>
    );
  }
}
