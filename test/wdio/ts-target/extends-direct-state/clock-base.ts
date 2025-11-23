import { State } from '@stencil/core';

/**
 * Simplified ClockBase class - demonstrates direct state management via Stencil's extends
 * 
 * Compare with Lit's ReactiveController pattern:
 * 
 * Lit Pattern:
 * - Controller extends ReactiveController interface
 * - Controller needs host reference: constructor(host: ReactiveControllerHost)
 * - Controller calls host.requestUpdate() to trigger re-renders
 * - Component creates controller instance: private clock = new ClockController(this)
 * - Component accesses controller.value in render()
 * 
 * Stencil Pattern (this class):
 * ✅ No interface to implement
 * ✅ No host reference needed
 * ✅ No requestUpdate() calls needed
 * ✅ Component just extends - no controller instance
 * ✅ Direct @State access in render()
 * 
 * This showcases Stencil's superior extends functionality
 */
export class ClockBase {
  @State() currentTime: string = new Date().toLocaleTimeString();
  @State() isClockRunning: boolean = true;
  
  private timer?: NodeJS.Timeout;
  private timerInterval: number = 1000;
  
  // Lifecycle methods
  componentDidLoad() {
    this.startClock();
  }
  
  disconnectedCallback() {
    this.stopClock();
  }
  
  // Clock control methods
  startClock() {
    if (this.timer) return; // Already running
    
    this.timer = setInterval(() => {
      // Direct state update - triggers re-render automatically
      // No requestUpdate() needed!
      this.currentTime = new Date().toLocaleTimeString();
    }, this.timerInterval);
  }
  
  stopClock() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
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
}
