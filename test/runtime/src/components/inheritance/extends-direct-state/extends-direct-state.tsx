import { Component, h, Method } from '@stencil/core';
import { ClockBase } from './clock-base.js';

/**
 * Tests direct state manipulation from a base class.
 * The base class has @State properties that are directly updated
 * without needing requestUpdate() - Stencil handles this automatically.
 *
 * This is simpler than Lit's ReactiveController pattern:
 * - No controller instance creation needed
 * - No host reference needed
 * - No requestUpdate() calls needed
 * - Just extend the base class and inherit @State directly
 */
@Component({
  tag: 'extends-direct-state',
})
export class ExtendsDirectState extends ClockBase {
  @Method()
  async getTime(): Promise<string> {
    return this.currentTime;
  }

  @Method()
  async getIsRunning(): Promise<boolean> {
    return this.isClockRunning;
  }

  @Method()
  async toggle(): Promise<void> {
    this.toggleClock();
  }

  render() {
    return (
      <div>
        <h2>Direct State Management Test</h2>
        <div class='clock-section'>
          <h3>Clock Controller (Direct State Pattern)</h3>
          <p class='current-time'>Current Time: {this.currentTime}</p>
          <button class='toggle-clock' onClick={() => this.toggleClock()}>
            {this.isClockRunning ? 'Stop Clock' : 'Start Clock'}
          </button>
        </div>
        <div class='status-info'>
          <p class='clock-status'>Clock Running: {this.isClockRunning ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }
}
