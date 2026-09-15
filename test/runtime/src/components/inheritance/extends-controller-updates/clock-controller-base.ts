/**
 * ClockControllerBase - simulates Lit's ReactiveController pattern
 * where the base class (controller) calls requestUpdate() to tell
 * the host component to re-render.
 *
 * The component implements requestUpdate() to update its @State.
 */
export abstract class ClockControllerBase {
  private timerInterval: number = 1000;
  private timer?: ReturnType<typeof setInterval>;

  // Abstract method that component must implement
  abstract requestUpdate(): void;

  componentDidLoad(): void {
    this.startClock();
  }

  disconnectedCallback(): void {
    this.stopClock();
  }

  startClock(): void {
    if (this.timer) return; // Already running
    this.timer = setInterval(() => {
      // This simulates Lit's this.host.requestUpdate()
      // Controller tells host "please update yourself"
      this.requestUpdate();
    }, this.timerInterval);
  }

  stopClock(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  getCurrentTimeValue(): string {
    return new Date().toLocaleTimeString();
  }
}
