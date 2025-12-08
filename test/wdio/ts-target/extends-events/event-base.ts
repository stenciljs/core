import { Listen, State } from '@stencil/core';

/**
 * EventBase - Base class demonstrating @Listen decorator inheritance
 * 
 * This base class provides:
 * 1. Global listeners (window, document)
 * 2. Local listeners (host)
 * 3. Event handlers that can be overridden
 */
export class EventBase {
  // Track event calls for testing
  @State() baseEventLog: string[] = [];
  @State() baseGlobalEventCount: number = 0;
  @State() baseLocalEventCount: number = 0;
  
  // Global window listener - inherited by child
  @Listen('base-window-event', { target: 'window' })
  handleBaseWindowEvent() {
    this.baseEventLog.push('base-window-event');
    this.baseGlobalEventCount++;
  }
  
  // Global document listener - inherited by child
  @Listen('base-document-event', { target: 'document' })
  handleBaseDocumentEvent() {
    this.baseEventLog.push('base-document-event');
    this.baseGlobalEventCount++;
  }
  
  // Local host listener - inherited by child
  @Listen('base-host-event')
  handleBaseHostEvent() {
    this.baseEventLog.push('base-host-event');
    this.baseLocalEventCount++;
  }
  
  // Event handler that can be overridden in child
  @Listen('override-event')
  handleOverrideEvent() {
    this.baseEventLog.push('override-event:base');
    this.baseLocalEventCount++;
  }
  
  // Helper method to get event log
  getEventLog(): string[] {
    return [...this.baseEventLog];
  }
  
  // Helper method to reset event tracking
  resetEventLog() {
    this.baseEventLog = [];
    this.baseGlobalEventCount = 0;
    this.baseLocalEventCount = 0;
  }
}


