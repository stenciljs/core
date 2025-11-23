import { Component, h } from '@stencil/core';
import { ClockBase } from './clock-base.js';

@Component({
  tag: 'extends-direct-state',
})
export class DirectStateCmp extends ClockBase {
  // Compare with Lit pattern:
  // Lit: private clock = new ClockController(this, 100);
  // Stencil: Just extend the base class - that's it!
  
  // No controller instance needed
  // No host reference needed
  // No manual requestUpdate() calls needed
  
  render() {
    return (
      <div>
        <h2>Direct State Management Test</h2>
        
        <div class="clock-section">
          <h3>Clock Controller (Direct State Pattern)</h3>
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
          <p class="update-info">Base class updates @State directly → Automatic re-render</p>
          <p class="inheritance-info">Leverages Stencil's superior extends functionality</p>
          <p class="pattern-info">@State lives on base class, no requestUpdate needed</p>
        </div>
        
        <div class="comparison-info">
          <h3>Comparison with Lit's ReactiveController Pattern</h3>
          <p class="simpler-info">✅ No ReactiveController interface to implement</p>
          <p class="direct-info">✅ No host reference needed in constructor</p>
          <p class="cleaner-info">✅ No host.requestUpdate() calls needed</p>
          <p class="stencil-info">✅ No controller instance creation on component</p>
          <p class="extends-info">✅ Just extend the base class and inherit @State directly</p>
        </div>
        
        <div class="lit-vs-stencil">
          <h3>Lit vs Stencil Code Comparison</h3>
          <p class="lit-pattern">Lit: private clock = new ClockController(this, 100);</p>
          <p class="stencil-pattern">Stencil: extends ClockBase // Just extend!</p>
          <p class="lit-render">Lit: html`Time: ${"${this.clock.value}"}`</p>
          <p class="stencil-render">Stencil: &lt;p&gt;Time: {'{this.currentTime}'}&lt;/p&gt;</p>
        </div>
      </div>
    );
  }
}
