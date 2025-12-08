/**
 * FocusControllerBase - demonstrates focus management controller via inheritance
 * 
 * This base class:
 * 1. Manages focus state (isFocused, hasFocus)
 * 2. Tracks focus/blur events
 * 3. Provides methods to handle focus lifecycle
 */
export abstract class FocusControllerBase {
  protected isFocused: boolean = false;
  protected focusCount: number = 0;
  protected blurCount: number = 0;
  
  constructor() {}
  
  // Abstract method - host component must implement this
  // This simulates Lit's this.host.requestUpdate()
  protected abstract requestUpdate(): void;
  
  // Lifecycle methods that components can use
  componentDidLoad() {
    // Setup focus tracking on component load
    this.setupFocusTracking();
  }
  
  disconnectedCallback() {
    // Cleanup focus tracking
    this.cleanupFocusTracking();
  }
  
  protected setupFocusTracking() {
    // Default implementation - can be extended
  }
  
  protected cleanupFocusTracking() {
    // Default implementation - can be extended
  }
  
  // Handle focus event
  handleFocus() {
    this.isFocused = true;
    this.focusCount++;
    this.requestUpdate();
  }
  
  // Handle blur event
  handleBlur() {
    this.isFocused = false;
    this.blurCount++;
    this.requestUpdate();
  }
  
  // Get focus state
  getFocusState() {
    return {
      isFocused: this.isFocused,
      focusCount: this.focusCount,
      blurCount: this.blurCount,
    };
  }
  
  // Reset focus tracking
  resetFocusTracking() {
    this.focusCount = 0;
    this.blurCount = 0;
    this.requestUpdate();
  }
}

