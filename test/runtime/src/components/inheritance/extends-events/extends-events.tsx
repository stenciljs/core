import { Component, Element, Listen, State } from '@stencil/core';

import { EventBase } from './event-base.js';

@Component({
  tag: 'extends-events',
})
export class ExtendsEvents extends EventBase {
  @Element() el!: HTMLElement;

  @State() childEventLog: string[] = [];
  @State() childGlobalEventCount: number = 0;
  @State() childLocalEventCount: number = 0;

  @Listen('child-window-event', { target: 'window' })
  handleChildWindowEvent() {
    this.childEventLog = [...this.childEventLog, 'child-window-event'];
    this.childGlobalEventCount++;
  }

  @Listen('child-document-event', { target: 'document' })
  handleChildDocumentEvent() {
    this.childEventLog = [...this.childEventLog, 'child-document-event'];
    this.childGlobalEventCount++;
  }

  @Listen('child-host-event')
  handleChildHostEvent() {
    this.childEventLog = [...this.childEventLog, 'child-host-event'];
    this.childLocalEventCount++;
  }

  @Listen('override-event')
  handleOverrideEvent() {
    this.childEventLog = [...this.childEventLog, 'override-event:child'];
    this.childLocalEventCount++;
  }

  @Listen('bubble-event')
  handleBubbleEvent(_e: Event) {
    this.childEventLog = [...this.childEventLog, 'bubble-event:child'];
    this.childLocalEventCount++;
  }

  triggerBaseWindowEvent() {
    window.dispatchEvent(
      new Event('base-window-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerBaseDocumentEvent() {
    document.dispatchEvent(
      new Event('base-document-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerBaseHostEvent() {
    this.el.dispatchEvent(
      new Event('base-host-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerChildWindowEvent() {
    window.dispatchEvent(
      new Event('child-window-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerChildDocumentEvent() {
    document.dispatchEvent(
      new Event('child-document-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerChildHostEvent() {
    this.el.dispatchEvent(
      new Event('child-host-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerOverrideEvent() {
    this.el.dispatchEvent(
      new Event('override-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  triggerBubbleEvent() {
    this.el.dispatchEvent(
      new Event('bubble-event', { bubbles: true, cancelable: true, composed: true }),
    );
  }

  getCombinedEventLog(): string[] {
    return [...this.baseEventLog, ...this.childEventLog];
  }

  render() {
    const combinedLog = this.getCombinedEventLog();
    const totalGlobal = this.baseGlobalEventCount + this.childGlobalEventCount;
    const totalLocal = this.baseLocalEventCount + this.childLocalEventCount;

    return (
      <div>
        <h2>Event Handling Inheritance Test</h2>

        <div class='event-info'>
          <p class='base-events'>Base Events: {this.baseEventLog.length}</p>
          <p class='child-events'>Child Events: {this.childEventLog.length}</p>
          <p class='total-events'>Total Events: {combinedLog.length}</p>
          <p class='global-count'>Global Events: {totalGlobal}</p>
          <p class='local-count'>Local Events: {totalLocal}</p>
        </div>

        <div class='event-log'>
          <ul id='event-log-list'>
            {combinedLog.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        </div>

        <div class='controls'>
          <button class='trigger-base-window' onClick={() => this.triggerBaseWindowEvent()}>
            Base Window Event
          </button>
          <button class='trigger-base-document' onClick={() => this.triggerBaseDocumentEvent()}>
            Base Document Event
          </button>
          <button class='trigger-base-host' onClick={() => this.triggerBaseHostEvent()}>
            Base Host Event
          </button>
          <button class='trigger-child-window' onClick={() => this.triggerChildWindowEvent()}>
            Child Window Event
          </button>
          <button class='trigger-child-document' onClick={() => this.triggerChildDocumentEvent()}>
            Child Document Event
          </button>
          <button class='trigger-child-host' onClick={() => this.triggerChildHostEvent()}>
            Child Host Event
          </button>
          <button class='trigger-override' onClick={() => this.triggerOverrideEvent()}>
            Override Event
          </button>
          <button class='trigger-bubble' onClick={() => this.triggerBubbleEvent()}>
            Bubble Event
          </button>
        </div>
      </div>
    );
  }
}
