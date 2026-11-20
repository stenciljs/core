import { Component, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'event-inner-component',
  shadow: true,
})
export class EventInnerComponent {
  @Event({ bubbles: true, composed: true })
  customClick: EventEmitter<void>;

  render() {
    return <button onClick={() => this.customClick.emit()}></button>;
  }
}

@Component({
  tag: 'event-wrapper-component',
  shadow: true,
})
export class EventWrapperComponent {
  render() {
    return (
      <div>
        <event-inner-component></event-inner-component>
      </div>
    );
  }
}
