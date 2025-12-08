import { Component, Element, h, Listen, State } from '@stencil/core';
import { EventBase } from './event-base.js';

/**
 * EventsCmp - Demonstrates @Listen decorator inheritance
 * 
 * This component:
 * 1. Extends EventBase (inherits base @Listen decorators)
 * 2. Adds additional @Listen decorators
 * 3. Overrides base event handler
 * 4. Demonstrates event bubbling and propagation
 */
@Component({
  tag: 'extends-events',
})
export class EventsCmp extends EventBase {
  @Element() el!: HTMLElement;
  
  // Child-specific event tracking
  @State() childEventLog: string[] = [];
  @State() childGlobalEventCount: number = 0;
  @State() childLocalEventCount: number = 0;
  
  // Additional global window listener in child
  @Listen('child-window-event', { target: 'window' })
  handleChildWindowEvent() {
    this.childEventLog.push('child-window-event');
    this.childGlobalEventCount++;
  }
  
  // Additional document listener in child
  @Listen('child-document-event', { target: 'document' })
  handleChildDocumentEvent() {
    this.childEventLog.push('child-document-event');
    this.childGlobalEventCount++;
  }
  
  // Additional local host listener in child
  @Listen('child-host-event')
  handleChildHostEvent() {
    this.childEventLog.push('child-host-event');
    this.childLocalEventCount++;
  }
  
  // Override base event handler - child version takes precedence
  @Listen('override-event')
  handleOverrideEvent() {
    this.childEventLog.push('override-event:child');
    this.childLocalEventCount++;
    // Note: base handler is NOT called automatically - this is override behavior
  }
  
  // Event that bubbles - test event propagation
  @Listen('bubble-event')
  handleBubbleEvent(_e: Event) {
    this.childEventLog.push('bubble-event:child');
    this.childLocalEventCount++;
    // Allow event to continue bubbling
  }
  
  // Method to trigger events for testing
  triggerBaseWindowEvent() {
    window.dispatchEvent(new Event('base-window-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerBaseDocumentEvent() {
    document.dispatchEvent(new Event('base-document-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerBaseHostEvent() {
    this.el.dispatchEvent(new Event('base-host-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerChildWindowEvent() {
    window.dispatchEvent(new Event('child-window-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerChildDocumentEvent() {
    document.dispatchEvent(new Event('child-document-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerChildHostEvent() {
    this.el.dispatchEvent(new Event('child-host-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerOverrideEvent() {
    this.el.dispatchEvent(new Event('override-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  triggerBubbleEvent() {
    this.el.dispatchEvent(new Event('bubble-event', { bubbles: true, cancelable: true, composed: true }));
  }
  
  // Expose base class method for testing
  getEventLog(): string[] {
    return super.getEventLog();
  }
  
  // Get combined event log
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
        
        <div class="event-info">
          <p class="base-events">Base Events: {this.baseEventLog.length}</p>
          <p class="child-events">Child Events: {this.childEventLog.length}</p>
          <p class="total-events">Total Events: {combinedLog.length}</p>
          <p class="global-count">Global Events: {totalGlobal}</p>
          <p class="local-count">Local Events: {totalLocal}</p>
        </div>
        
        <div class="event-log">
          <h3>Event Log:</h3>
          <ul id="event-log-list">
            {combinedLog.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        </div>
        
        <div class="controls">
          <h3>Trigger Events:</h3>
          <button class="trigger-base-window" onClick={() => this.triggerBaseWindowEvent()}>
            Base Window Event
          </button>
          <button class="trigger-base-document" onClick={() => this.triggerBaseDocumentEvent()}>
            Base Document Event
          </button>
          <button class="trigger-base-host" onClick={() => this.triggerBaseHostEvent()}>
            Base Host Event
          </button>
          <button class="trigger-child-window" onClick={() => this.triggerChildWindowEvent()}>
            Child Window Event
          </button>
          <button class="trigger-child-document" onClick={() => this.triggerChildDocumentEvent()}>
            Child Document Event
          </button>
          <button class="trigger-child-host" onClick={() => this.triggerChildHostEvent()}>
            Child Host Event
          </button>
          <button class="trigger-override" onClick={() => this.triggerOverrideEvent()}>
            Override Event
          </button>
          <button class="trigger-bubble" onClick={() => this.triggerBubbleEvent()}>
            Bubble Event
          </button>
        </div>
        
        <div class="test-info">
          <p>Features: @Listen inheritance | Global vs Local listeners | Event handler override | Event bubbling</p>
        </div>
      </div>
    );
  }
}


