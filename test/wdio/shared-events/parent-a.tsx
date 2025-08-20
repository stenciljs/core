import { Component, Element, Event, EventEmitter, h, Listen, State } from '@stencil/core';

// Import from TypeScript file using .js extension (Node16/NodeNext module resolution)
// The source file is event-constants.ts, but we use .js to reference the compiled output
import { EVENT_NAMES, SHARED_EVENT } from './event-constants.js';

@Component({
  tag: 'parent-a',
  scoped: true,
})
export class ParentA {
  @Element() el!: HTMLElement;

  // Store events in memory only (not state) to prevent re-renders
  private receivedEvents: string[] = [];
  // Keep eventCount as state so it displays in DOM
  @State() eventCount = 0;

  /**
   * Events emitted by Parent A
   */
  @Event({ eventName: EVENT_NAMES.A_TO_BC }) toBothSiblings!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.A_TO_B }) toSiblingB!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.A_TO_C }) toSiblingC!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.A_TO_D }) toNestedChild!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.A_TO_E }) toExternal!: EventEmitter<string>;

  disconnectedCallback() {
    this.receivedEvents.length = 0;
    this.eventCount = 0;
  }

  /**
   * Listen for events from other components
   */

  /**
   * Listen for events from Sibling B
   * @param event - The event from Sibling B
   */
  @Listen(EVENT_NAMES.B_TO_A)
  onFromSiblingB(event: CustomEvent<string>) {
    this.addReceivedEvent(`B→A: ${event.detail}`);
  }

  /**
   * Listen for events from Sibling C
   * @param event - The event from Sibling C
   */
  @Listen(EVENT_NAMES.C_TO_A)
  onFromSiblingC(event: CustomEvent<string>) {
    this.addReceivedEvent(`C→A: ${event.detail}`);
  }

  /**
   * Listen for events from Nested Child D
   * @param event - The event from Nested Child D
   */
  @Listen(EVENT_NAMES.D_TO_A)
  onFromNestedChild(event: CustomEvent<string>) {
    this.addReceivedEvent(`D→A: ${event.detail}`);
  }

  /**
   * Listen for events from External E
   * @param event - The event from External E
   */
  @Listen(EVENT_NAMES.E_TO_A)
  onFromExternal(event: CustomEvent<string>) {
    this.addReceivedEvent(`E→A: ${event.detail}`);
  }

  /**
   * Listen for the shared event constant
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
   * A fires events to different components
   */
  private fireToBothSiblings = () => {
    this.toBothSiblings.emit('A→BC: Message from Parent A to both siblings');
  };

  private fireToSiblingB = () => {
    this.toSiblingB.emit('A→B: Message from Parent A to Sibling B');
  };

  private fireToSiblingC = () => {
    this.toSiblingC.emit('A→C: Message from Parent A to Sibling C');
  };

  private fireToNestedChild = () => {
    this.toNestedChild.emit('A→D: Message from Parent A to Nested Child D');
  };

  private fireToExternal = () => {
    this.toExternal.emit('A→E: Message from Parent A to External E');
  };

  /**
   * A fires shared event
   */
  private fireSharedEvent = () => {
    const event = new CustomEvent(SHARED_EVENT, {
      detail: 'A→SharedEvent: Parent A using shared event',
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
      <div class="parent-container">
        <h3>Parent Component A</h3>

        <div class="controls">
          <button id="a-to-bc" onClick={this.fireToBothSiblings}>
            A→BC (Both Siblings)
          </button>
          <button id="a-to-b" onClick={this.fireToSiblingB}>
            A→B (Sibling B)
          </button>
          <button id="a-to-c" onClick={this.fireToSiblingC}>
            A→C (Sibling C)
          </button>
          <button id="a-to-d" onClick={this.fireToNestedChild}>
            A→D (Nested Child)
          </button>
          <button id="a-to-e" onClick={this.fireToExternal}>
            A→E (External)
          </button>
          <button id="a-shared" onClick={this.fireSharedEvent}>
            A→Shared Event
          </button>
          <button id="a-clear" onClick={this.clearEvents}>
            Clear Events
          </button>
        </div>

        <div class="event-log">
          <h4>Parent Component A - Events in Memory</h4>
          <div id="parent-events" data-event-count={this.eventCount}>
            Events stored in memory (not rendered to save performance)
          </div>
          <div id="event-count">Events received: {this.eventCount}</div>
        </div>

        <div class="children">
          <sibling-b></sibling-b>
          <sibling-c></sibling-c>
        </div>
      </div>
    );
  }
}
