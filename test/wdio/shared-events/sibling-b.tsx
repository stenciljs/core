import { Component, Element, Event, EventEmitter, h, Listen, State } from '@stencil/core';

// Import from TypeScript file using .js extension (Node16/NodeNext module resolution)
// The source file is event-constants.ts, but we use .js to reference the compiled output
import { EVENT_NAMES, SHARED_EVENT } from './event-constants.js';

@Component({
  tag: 'sibling-b',
  scoped: true,
})
export class SiblingB {
  @Element() el!: HTMLElement;

  // Store events in memory only (not state) to prevent re-renders
  private receivedEvents: string[] = [];
  // Keep eventCount as state so it displays in DOM
  @State() eventCount = 0;

  /**
   * Events emitted by Sibling B
   */
  @Event({ eventName: EVENT_NAMES.B_TO_A }) toParentA!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.B_TO_C }) toSiblingC!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.B_TO_D }) toNestedChild!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.B_TO_E }) toExternal!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.B_TO_AC }) toParentAndSibling!: EventEmitter<string>;

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
  @Listen(EVENT_NAMES.A_TO_B)
  onFromParentA(event: CustomEvent<string>) {
    this.addReceivedEvent(`A→B: ${event.detail}`);
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
   * Listen for events from Sibling C
   * @param event - The event from Sibling C
   */
  @Listen(EVENT_NAMES.C_TO_B)
  onFromSiblingC(event: CustomEvent<string>) {
    this.addReceivedEvent(`C→B: ${event.detail}`);
  }

  /**
   * Listen for events from Nested Child D
   * @param event - The event from Nested Child D
   */
  @Listen(EVENT_NAMES.D_TO_B)
  onFromNestedChild(event: CustomEvent<string>) {
    this.addReceivedEvent(`D→B: ${event.detail}`);
  }

  /**
   * Listen for events from External E
   * @param event - The event from External E
   */
  @Listen(EVENT_NAMES.E_TO_B)
  onFromExternal(event: CustomEvent<string>) {
    this.addReceivedEvent(`E→B: ${event.detail}`);
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
   * B fires events to different components
   */
  private fireToParentA = () => {
    this.toParentA.emit('B→A: Message from Sibling B to Parent A');
  };

  private fireToSiblingC = () => {
    this.toSiblingC.emit('B→C: Message from Sibling B to Sibling C');
  };

  private fireToNestedChild = () => {
    this.toNestedChild.emit('B→D: Message from Sibling B to Nested Child D');
  };

  private fireToExternal = () => {
    this.toExternal.emit('B→E: Message from Sibling B to External E');
  };

  private fireToParentAndSibling = () => {
    this.toParentAndSibling.emit('B→AC: Message from Sibling B to Parent A and Sibling C');
  };

  /**
   * B fires shared event
   */
  private fireSharedEvent = () => {
    const event = new CustomEvent(SHARED_EVENT, {
      detail: 'B→SharedEvent: Sibling B using shared event',
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
        <h4>Sibling B Component</h4>

        <div class="controls">
          <button id="b-to-a" onClick={this.fireToParentA}>
            B→A (Parent)
          </button>
          <button id="b-to-c" onClick={this.fireToSiblingC}>
            B→C (Sibling C)
          </button>
          <button id="b-to-d" onClick={this.fireToNestedChild}>
            B→D (Nested Child)
          </button>
          <button id="b-to-e" onClick={this.fireToExternal}>
            B→E (External)
          </button>
          <button id="b-to-ac" onClick={this.fireToParentAndSibling}>
            B→AC (Parent & C)
          </button>
          <button id="b-shared" onClick={this.fireSharedEvent}>
            B→Shared Event
          </button>
          <button id="b-clear" onClick={this.clearEvents}>
            Clear Events
          </button>
        </div>

        <div class="event-log">
          <h5>Sibling B - Events in Memory</h5>
          <div id="sibling-b-events" data-event-count={this.eventCount}>
            Events stored in memory (not rendered to save performance)
          </div>
        </div>
      </div>
    );
  }
}
