import { Component, Event, EventEmitter, Method } from '@stencil/core';

@Component({
  tag: 'event-cmp',
})
export class EventCmp {
  @Event() myDocumentEvent: EventEmitter<any>;

  @Event({
    eventName: 'my-event-with-options',
    bubbles: false,
    cancelable: false,
  })
  myEventWithOptions: EventEmitter<{ mph: number }>;

  @Event() myWindowEvent: EventEmitter<number>;

  /**
   * this is some method that fires a window event
   * @param value some value
   * @returns {void}
   */
  @Method()
  async methodThatFiresMyWindowEvent(value: number) {
    this.myWindowEvent.emit(value);
  }

  /**
   * this is some method that fires a document event
   * @returns {void}
   */
  @Method()
  async methodThatFiresMyDocumentEvent() {
    this.myDocumentEvent.emit();
  }

  /**
   * this is some method that fires an event with options
   * @param mph some value
   * @returns {void}
   */
  @Method()
  async methodThatFiresEventWithOptions(mph: number) {
    this.myEventWithOptions.emit({ mph });
  }
}
