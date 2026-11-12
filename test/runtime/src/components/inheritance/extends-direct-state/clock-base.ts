import { State } from '@stencil/core';

/**
 * ClockBase - a base class that manages a clock timer.
 * Demonstrates direct @State manipulation from a base class
 * that automatically triggers re-renders.
 */
export class ClockBase {
  @State() currentTime: string = new Date().toLocaleTimeString();
  @State() isClockRunning: boolean = true;

  private timerInterval: number = 1000;
  private timer?: ReturnType<typeof setInterval>;

  componentDidLoad(): void {
    this.startClock();
  }

  disconnectedCallback(): void {
    this.stopClock();
  }

  startClock(): void {
    if (this.timer) return; // Already running
    this.timer = setInterval(() => {
      // Direct state update - triggers re-render automatically
      // No requestUpdate() needed!
      this.currentTime = new Date().toLocaleTimeString();
    }, this.timerInterval);
  }

  stopClock(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  toggleClock(): void {
    if (this.isClockRunning) {
      this.stopClock();
      this.isClockRunning = false;
    } else {
      this.startClock();
      this.isClockRunning = true;
    }
  }
}
