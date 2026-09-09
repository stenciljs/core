import { Listen, State } from '@stencil/core';

export class EventBase {
  @State() baseEventLog: string[] = [];
  @State() baseGlobalEventCount: number = 0;
  @State() baseLocalEventCount: number = 0;

  @Listen('base-window-event', { target: 'window' })
  handleBaseWindowEvent() {
    this.baseEventLog = [...this.baseEventLog, 'base-window-event'];
    this.baseGlobalEventCount++;
  }

  @Listen('base-document-event', { target: 'document' })
  handleBaseDocumentEvent() {
    this.baseEventLog = [...this.baseEventLog, 'base-document-event'];
    this.baseGlobalEventCount++;
  }

  @Listen('base-host-event')
  handleBaseHostEvent() {
    this.baseEventLog = [...this.baseEventLog, 'base-host-event'];
    this.baseLocalEventCount++;
  }

  @Listen('override-event')
  handleOverrideEvent() {
    this.baseEventLog = [...this.baseEventLog, 'override-event:base'];
    this.baseLocalEventCount++;
  }

  getEventLog(): string[] {
    return [...this.baseEventLog];
  }

  resetEventLog() {
    this.baseEventLog = [];
    this.baseGlobalEventCount = 0;
    this.baseLocalEventCount = 0;
  }
}
