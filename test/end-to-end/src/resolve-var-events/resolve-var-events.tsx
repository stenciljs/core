import { Component, Event, EventEmitter, Listen, Method, State, h, resolveVar } from '@stencil/core';

import { IMPORTED_EVENTS } from './resolve-var-events.consts';

const MY_EVENT = 'myEvent';
const OTHER_EVENT = 'otherEvent';

const EVENTS = {
  MY_EVENT: 'myEvent',
  OTHER_EVENT: 'otherEvent',
} as const;

@Component({
  tag: 'resolve-var-events',
  shadow: true,
})
export class ResolveVarEvents {
  @State() myEventCount = 0;
  @State() otherEventCount = 0;
  @State() importedEventCount = 0;

  @Event({ eventName: resolveVar(MY_EVENT) }) myEvent: EventEmitter;
  @Event({ eventName: resolveVar(EVENTS.OTHER_EVENT) }) otherEvent: EventEmitter;
  @Event({ eventName: resolveVar(IMPORTED_EVENTS.IMPORTED_EVENT) }) importedEvent: EventEmitter;

  @Listen(resolveVar(MY_EVENT))
  onMyEvent() {
    this.myEventCount++;
  }

  @Listen(resolveVar(OTHER_EVENT))
  onOtherEvent() {
    this.otherEventCount++;
  }

  @Listen(resolveVar(IMPORTED_EVENTS.IMPORTED_EVENT))
  onImportedEvent() {
    this.importedEventCount++;
  }

  @Method()
  async emitMyEvent() {
    this.myEvent.emit();
  }

  @Method()
  async emitOtherEvent() {
    this.otherEvent.emit();
  }

  @Method()
  async emitImportedEvent() {
    this.importedEvent.emit();
  }

  render() {
    return (
      <div>
        <div class="my-event-count">{this.myEventCount}</div>
        <div class="other-event-count">{this.otherEventCount}</div>
        <div class="imported-event-count">{this.importedEventCount}</div>
      </div>
    );
  }
}
