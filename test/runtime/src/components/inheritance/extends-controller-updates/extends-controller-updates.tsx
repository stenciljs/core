import { Component, h, State, Method } from '@stencil/core';

import { ClockControllerBase } from './clock-controller-base.js';

/**
 * Tests the requestUpdate pattern where the base class (controller)
 * calls requestUpdate() to trigger the component to update its @State.
 *
 * This simulates Lit's ReactiveController pattern:
 * - Controller calls this.host.requestUpdate()
 * - Host component updates its state and re-renders
 */
@Component({
  tag: 'extends-controller-updates',
})
export class ExtendsControllerUpdates extends ClockControllerBase {
  // Component owns the @State - not the base class
  @State() currentTime: string = new Date().toLocaleTimeString();
  @State() isClockRunning: boolean = true;

  // Component implements the requestUpdate method
  // (simulates Lit's this.host.requestUpdate())
  requestUpdate(): void {
    // Controller calls this method to request a re-render
    // Component updates its own @State which triggers re-render
    this.currentTime = this.getCurrentTimeValue();
  }

  @Method()
  async toggle(): Promise<void> {
    if (this.isClockRunning) {
      this.stopClock();
      this.isClockRunning = false;
    } else {
      this.startClock();
      this.isClockRunning = true;
    }
  }

  @Method()
  async getTime(): Promise<string> {
    return this.currentTime;
  }

  @Method()
  async getIsRunning(): Promise<boolean> {
    return this.isClockRunning;
  }

  render() {
    return (
      <div>
        <h2>Controller-Initiated Updates Test</h2>
        <div class='clock-section'>
          <h3>Clock Controller (requestUpdate Pattern)</h3>
          <p class='current-time'>Current Time: {this.currentTime}</p>
          <button class='toggle-clock' onClick={() => this.toggle()}>
            {this.isClockRunning ? 'Stop Clock' : 'Start Clock'}
          </button>
        </div>
        <div class='status-info'>
          <p class='clock-status'>Clock Running: {this.isClockRunning ? 'Yes' : 'No'}</p>
          <p class='pattern-info'>@State lives on component, controller requests updates</p>
        </div>
      </div>
    );
  }
}
