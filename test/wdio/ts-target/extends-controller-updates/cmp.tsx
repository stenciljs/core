import { Component, h, State } from '@stencil/core';
import { ClockControllerBase } from './clock-controller-base.js';

@Component({
  tag: 'extends-controller-updates',
})
export class ControllerUpdatesCmp extends ClockControllerBase {
  // Component owns the @State - not the base class
  @State() currentTime: string = new Date().toLocaleTimeString();
  @State() isClockRunning: boolean = true;
  
  constructor() {
    super(); // No parameters needed
  }
  
  // Component implements the requestUpdate method (simulates Lit's this.host.requestUpdate())
  protected requestUpdate(): void {
    // Controller calls this method to request a re-render
    // Component updates its own @State which triggers re-render
    this.currentTime = this.getCurrentTimeValue();
  }
  
  toggleClock() {
    if (this.isClockRunning) {
      this.stopClock();
      this.isClockRunning = false;
    } else {
      this.startClock();
      this.isClockRunning = true;
    }
  }
  
  render() {
    return (
      <div>
        <h2>Controller-Initiated Updates Test</h2>
        
        <div class="clock-section">
          <h3>Clock Controller (requestUpdate Pattern)</h3>
          <p class="current-time">Current Time: {this.currentTime}</p>
          <button 
            class="toggle-clock" 
            onClick={() => this.toggleClock()}
          >
            {this.isClockRunning ? 'Stop Clock' : 'Start Clock'}
          </button>
        </div>
        
        <div class="status-info">
          <h3>How It Works</h3>
          <p class="clock-status">Clock Running: {this.isClockRunning ? 'Yes' : 'No'}</p>
          <p class="update-info">Base class calls requestUpdate() → Component updates @State → Re-render</p>
          <p class="inheritance-info">Simulates Lit's this.host.requestUpdate() pattern</p>
          <p class="pattern-info">@State lives on component, controller requests updates</p>
        </div>
      </div>
    );
  }
}
