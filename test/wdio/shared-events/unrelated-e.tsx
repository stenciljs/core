import { Component, Element, Event, EventEmitter, h, Listen, State } from '@stencil/core';

// Import from TypeScript file using .js extension (Node16/NodeNext module resolution)
// The source file is event-constants.ts, but we use .js to reference the compiled output
import { EVENT_NAMES, SHARED_EVENT } from './event-constants.js';

@Component({
  tag: 'unrelated-e',
  scoped: true,
})
export class UnrelatedE {
  @Element() el!: HTMLElement;

  // Store events in memory only (not state) to prevent re-renders
  private receivedEvents: string[] = [];
  // Keep eventCount as state so it displays in DOM
  @State() eventCount = 0;

  /**
   * Events emitted by External E
   */
  @Event({ eventName: EVENT_NAMES.E_TO_A }) toParentA!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.E_TO_B }) toSiblingB!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.E_TO_C }) toSiblingC!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.E_TO_D }) toNestedChild!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.E_TO_AB }) toParentAndB!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.E_TO_AC }) toParentAndC!: EventEmitter<string>;
  @Event({ eventName: EVENT_NAMES.E_TO_AD }) toParentAndD!: EventEmitter<string>;

  disconnectedCallback() {
    this.receivedEvents.length = 0;
    this.eventCount = 0;
  }

  /**
   * Listen for events from family components
   */

  /**
   * Listen for events from Parent A
   * @param event - The event from Parent A
   */
  @Listen(EVENT_NAMES.A_TO_E)
  onFromParentA(event: CustomEvent<string>) {
    this.addReceivedEvent(`A→E: ${event.detail}`);
  }

  /**
   * Listen for events from Sibling B
   * @param event - The event from Sibling B
   */
  @Listen(EVENT_NAMES.B_TO_E)
  onFromSiblingB(event: CustomEvent<string>) {
    this.addReceivedEvent(`B→E: ${event.detail}`);
  }

  /**
   * Listen for events from Sibling C
   * @param event - The event from Sibling C
   */
  @Listen(EVENT_NAMES.C_TO_E)
  onFromSiblingC(event: CustomEvent<string>) {
    this.addReceivedEvent(`C→E: ${event.detail}`);
  }

  /**
   * Listen for events from Nested Child D
   * @param event - The event from Nested Child D
   */
  @Listen(EVENT_NAMES.D_TO_E)
  onFromNestedChild(event: CustomEvent<string>) {
    this.addReceivedEvent(`D→E: ${event.detail}`);
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
   * E fires events to different family components
   */
  private fireToParentA = () => {
    this.toParentA.emit('E→A: Message from External E to Parent A');
  };

  private fireToSiblingB = () => {
    this.toSiblingB.emit('E→B: Message from External E to Sibling B');
  };

  private fireToSiblingC = () => {
    this.toSiblingC.emit('E→C: Message from External E to Sibling C');
  };

  private fireToNestedChild = () => {
    this.toNestedChild.emit('E→D: Message from External E to Nested Child D');
  };

  private fireToParentAndB = () => {
    this.toParentAndB.emit('E→AB: Message from External E to Parent A and Sibling B');
  };

  private fireToParentAndC = () => {
    this.toParentAndC.emit('E→AC: Message from External E to Parent A and Sibling C');
  };

  private fireToParentAndD = () => {
    this.toParentAndD.emit('E→AD: Message from External E to Parent A and Nested Child D');
  };

  /**
   * E fires shared event
   */
  private fireSharedEvent = () => {
    const event = new CustomEvent(SHARED_EVENT, {
      detail: 'E→SharedEvent: External E using shared event',
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
      <div class="unrelated-container">
        <h3>Unrelated Component E (External)</h3>
        <p>This component is outside the family tree</p>

        <div class="controls">
          <button id="e-to-a" onClick={this.fireToParentA}>
            E→A (Parent)
          </button>
          <button id="e-to-b" onClick={this.fireToSiblingB}>
            E→B (Sibling B)
          </button>
          <button id="e-to-c" onClick={this.fireToSiblingC}>
            E→C (Sibling C)
          </button>
          <button id="e-to-d" onClick={this.fireToNestedChild}>
            E→D (Nested Child)
          </button>
          <button id="e-to-ab" onClick={this.fireToParentAndB}>
            E→AB (Parent & B)
          </button>
          <button id="e-to-ac" onClick={this.fireToParentAndC}>
            E→AC (Parent & C)
          </button>
          <button id="e-to-ad" onClick={this.fireToParentAndD}>
            E→AD (Parent & D)
          </button>
          <button id="e-shared" onClick={this.fireSharedEvent}>
            E→Shared Event
          </button>
          <button id="e-clear" onClick={this.clearEvents}>
            Clear Events
          </button>
        </div>

        <div class="event-log">
          <h4>External Component E - Events in Memory</h4>
          <div id="unrelated-e-events" data-event-count={this.eventCount}>
            Events stored in memory (not rendered to save performance)
          </div>
        </div>
      </div>
    );
  }
}
