import { Component, Element, Event, EventEmitter, h, Listen, State } from '@stencil/core';

// Import from TypeScript file using .js extension (Node16/NodeNext module resolution)
// The source file is event-constants.ts, but we use .js to reference the compiled output
import { EVENT_NAMES, SHARED_EVENT } from './event-constants.js';

@Component({
  tag: 'sibling-c',
  scoped: true,
})
export class SiblingC {
  @Element() el!: HTMLElement;

  // Store events in memory only (not state) to prevent re-renders
  private receivedEvents: string[] = [];
  // Keep eventCount as state so it displays in DOM
  @State() eventCount = 0;

  /**
   * Events emitted by Sibling C
   */
  @Event({ eventName: EVENT_NAMES.C_TO_A }) toParentA!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.C_TO_B }) toSiblingB!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.C_TO_D }) toNestedChild!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.C_TO_E }) toExternal!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.C_TO_AB }) toParentAndSibling!: EventEmitter<string>;

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
  @Listen(EVENT_NAMES.A_TO_C)
  onFromParentA(event: CustomEvent<string>) {
    this.addReceivedEvent(`A→C: ${event.detail}`);
  }

  /**
   * Listen for events from Parent A
   * @param event - The event from Parent A
   */
  @Listen(EVENT_NAMES.A_TO_BC)
  onFromParentToBoth(event: CustomEvent<string>) {
    this.addReceivedEvent(`A→BC: ${event.detail}`);
  }

  /**
   * Listen for events from Sibling B
   * @param event - The event from Sibling B
   */
  @Listen(EVENT_NAMES.B_TO_C)
  onFromSiblingB(event: CustomEvent<string>) {
    this.addReceivedEvent(`B→C: ${event.detail}`);
  }

  /**
   * Listen for events from Nested Child D
   * @param event - The event from Nested Child D
   */
  @Listen(EVENT_NAMES.D_TO_C)
  onFromNestedChild(event: CustomEvent<string>) {
    this.addReceivedEvent(`D→C: ${event.detail}`);
  }

  /**
   * Listen for events from External E
   * @param event - The event from External E
   */
  @Listen(EVENT_NAMES.E_TO_C)
  onFromExternal(event: CustomEvent<string>) {
    this.addReceivedEvent(`E→C: ${event.detail}`);
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
   * C fires events to different components
   */
  private fireToParentA = () => {
    this.toParentA.emit('C→A: Message from Sibling C to Parent A');
  };

  private fireToSiblingB = () => {
    this.toSiblingB.emit('C→B: Message from Sibling C to Sibling B');
  };

  private fireToNestedChild = () => {
    this.toNestedChild.emit('C→D: Message from Sibling C to Nested Child D');
  };

  private fireToExternal = () => {
    this.toExternal.emit('C→E: Message from Sibling C to External E');
  };

  private fireToParentAndSibling = () => {
    this.toParentAndSibling.emit('C→AB: Message from Sibling C to Parent A and Sibling B');
  };

  /**
   * C fires shared event
   */
  private fireSharedEvent = () => {
    const event = new CustomEvent(SHARED_EVENT, {
      detail: 'C→SharedEvent: Sibling C using shared event',
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
      <div class="sibling-container">
        <h4>Sibling C Component</h4>

        <div class="controls">
          <button id="c-to-a" onClick={this.fireToParentA}>
            C→A (Parent)
          </button>
          <button id="c-to-b" onClick={this.fireToSiblingB}>
            C→B (Sibling B)
          </button>
          <button id="c-to-d" onClick={this.fireToNestedChild}>
            C→D (Nested Child)
          </button>
          <button id="c-to-e" onClick={this.fireToExternal}>
            C→E (External)
          </button>
          <button id="c-to-ab" onClick={this.fireToParentAndSibling}>
            C→AB (Parent & B)
          </button>
          <button id="c-shared" onClick={this.fireSharedEvent}>
            C→Shared Event
          </button>
          <button id="c-clear" onClick={this.clearEvents}>
            Clear Events
          </button>
        </div>

        <div class="event-log">
          <h5>Sibling C - Events in Memory</h5>
          <div id="sibling-c-events" data-event-count={this.eventCount}>
            Events stored in memory (not rendered to save performance)
          </div>
        </div>

        <div class="nested-child">
          <nested-child-d></nested-child-d>
        </div>
      </div>
    );
  }
}
