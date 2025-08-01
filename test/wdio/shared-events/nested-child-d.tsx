import { Component, Element, Event, EventEmitter, h, Listen, State } from '@stencil/core';

import { EVENT_NAMES, SHARED_EVENT } from './event-constants';

@Component({
  tag: 'nested-child-d',
  scoped: true,
})
export class NestedChildD {
  @Element() el!: HTMLElement;

  // Store events in memory only (not state) to prevent re-renders
  private receivedEvents: string[] = [];
  // Keep eventCount as state so it displays in DOM
  @State() eventCount = 0;

  /**
   * Events emitted by Nested Child D
   */
  @Event({ eventName: EVENT_NAMES.D_TO_A }) toParentA!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.D_TO_B }) toSiblingB!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.D_TO_C }) toSiblingC!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.D_TO_E }) toExternal!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.D_TO_AB }) toParentAndB!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.D_TO_AC }) toParentAndC!: EventEmitter<string>;

  disconnectedCallback() {
    this.receivedEvents.length = 0;
    this.eventCount = 0;
  }

  /**
   * Listen for events from other components
   */

  /**
   * Listen for events from Parent A
   * @param event - The event from Parent A
   */
  @Listen(EVENT_NAMES.A_TO_D)
  onFromParentA(event: CustomEvent<string>) {
    this.addReceivedEvent(`A→D: ${event.detail}`);
  }

  /**
   * Listen for events from Sibling B
   * @param event - The event from Sibling B
   */
  @Listen(EVENT_NAMES.B_TO_D)
  onFromSiblingB(event: CustomEvent<string>) {
    this.addReceivedEvent(`B→D: ${event.detail}`);
  }

  /**
   * Listen for events from Sibling C
   * @param event - The event from Sibling C
   */
  @Listen(EVENT_NAMES.C_TO_D)
  onFromSiblingC(event: CustomEvent<string>) {
    this.addReceivedEvent(`C→D: ${event.detail}`);
  }

  /**
   * Listen for events from External E
   * @param event - The event from External E
   */
  @Listen(EVENT_NAMES.E_TO_D)
  onFromExternal(event: CustomEvent<string>) {
    this.addReceivedEvent(`E→D: ${event.detail}`);
  }

  /**
   * Listen for shared event
   * @param event - The event from the shared event
   */
  @Listen(SHARED_EVENT)
  onSharedEvent(event: CustomEvent<string>) {
    this.addReceivedEvent(`SharedEvent: ${event.detail}`);
  }

  private addReceivedEvent(message: string) {
    this.receivedEvents.push(message);
    this.eventCount++;
  }

  /**
   * D fires events to different components
   */
  private fireToParentA = () => {
    this.toParentA.emit('D→A: Message from Nested Child D to Parent A');
  };

  private fireToSiblingB = () => {
    this.toSiblingB.emit('D→B: Message from Nested Child D to Sibling B');
  };

  private fireToSiblingC = () => {
    this.toSiblingC.emit('D→C: Message from Nested Child D to Sibling C');
  };

  private fireToExternal = () => {
    this.toExternal.emit('D→E: Message from Nested Child D to External E');
  };

  private fireToParentAndB = () => {
    this.toParentAndB.emit('D→AB: Message from Nested Child D to Parent A and Sibling B');
  };

  private fireToParentAndC = () => {
    this.toParentAndC.emit('D→AC: Message from Nested Child D to Parent A and Sibling C');
  };

  /**
   * D fires shared event
   */
  private fireSharedEvent = () => {
    const event = new CustomEvent(SHARED_EVENT, {
      detail: 'D→SharedEvent: Nested Child D using shared event',
      bubbles: true,
    });
    this.el.dispatchEvent(event);
  };

  private clearEvents = () => {
    this.receivedEvents.length = 0;
    this.eventCount = 0;
  };

  // Public method for tests to access received events
  getReceivedEvents(): string[] {
    return [...this.receivedEvents];
  }

  getEventCount(): number {
    return this.eventCount;
  }

  render() {
    return (
      <div class="nested-child-container">
        <h5>Nested Child D Component</h5>

        <div class="controls">
          <button id="d-to-a" onClick={this.fireToParentA}>
            D→A (Parent)
          </button>
          <button id="d-to-b" onClick={this.fireToSiblingB}>
            D→B (Sibling B)
          </button>
          <button id="d-to-c" onClick={this.fireToSiblingC}>
            D→C (Sibling C)
          </button>
          <button id="d-to-e" onClick={this.fireToExternal}>
            D→E (External)
          </button>
          <button id="d-to-ab" onClick={this.fireToParentAndB}>
            D→AB (Parent & B)
          </button>
          <button id="d-to-ac" onClick={this.fireToParentAndC}>
            D→AC (Parent & C)
          </button>
          <button id="d-shared" onClick={this.fireSharedEvent}>
            D→Shared Event
          </button>
          <button id="d-clear" onClick={this.clearEvents}>
            Clear Events
          </button>
        </div>

        <div class="event-log">
          <h6>Nested Child D - Events in Memory</h6>
          <div id="nested-d-events" data-event-count={this.eventCount}>
            Events stored in memory (not rendered to save performance)
          </div>
        </div>
      </div>
    );
  }
}
