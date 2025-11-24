/**
 * ClockController base class - demonstrates controller-initiated updates via requestUpdate pattern
 * Modeled after Lit's ClockController: https://lit.dev/docs/composition/controllers/#content
 * 
 * This base class:
 * 1. Manages timer lifecycle (start/stop)
 * 2. Requests host component updates via abstract requestUpdate() method
 * 3. Host component owns @State and implements requestUpdate()
 * 
 * This simulates Lit's this.host.requestUpdate() pattern
 */
export abstract class ClockControllerBase {
  private timer?: NodeJS.Timeout;
  private timerInterval: number;
  
  constructor() {
    this.timerInterval = 1000;
  }
  
  // Abstract method - host component must implement this
  // This simulates Lit's this.host.requestUpdate()
  protected abstract requestUpdate(): void;
  
  // Lifecycle methods that components can use
  componentDidLoad() {
    this.startClock();
  }
  
  disconnectedCallback() {
    this.stopClock();
  }
  
  // Controller methods - can be called by host component
  startClock() {
    if (this.timer) return; // Already running
    
    this.timer = setInterval(() => {
      // This simulates Lit's this.host.requestUpdate()
      // Controller tells host "please update yourself"
      this.requestUpdate();
    }, this.timerInterval);
  }
  
  stopClock() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
  
  // Utility method for host to get current time
  protected getCurrentTimeValue(): string {
    return new Date().toLocaleTimeString();
  }
}