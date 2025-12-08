/**
 * FocusController - demonstrates focus management controller via composition
 * 
 * This controller:
 * 1. Manages focus state (isFocused, hasFocus)
 * 2. Tracks focus/blur events
 * 3. Provides methods to handle focus lifecycle
 */
import { forceUpdate } from "@stencil/core";
import type {
  ReactiveControllerHost,
  ReactiveController,
} from "./reactive-controller-host.js";

export class FocusController implements ReactiveController {
  private host: ReactiveControllerHost;
  private isFocused: boolean = false;
  private focusCount: number = 0;
  private blurCount: number = 0;
  
  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }
  
  // Lifecycle methods
  hostDidLoad() {
    // Setup focus tracking on component load
    this.setupFocusTracking();
  }
  
  hostDisconnected() {
    // Cleanup focus tracking
    this.cleanupFocusTracking();
  }
  
  private setupFocusTracking() {
    // Default implementation - can be extended
  }
  
  private cleanupFocusTracking() {
    // Default implementation - can be extended
  }
  
  // Handle focus event
  handleFocus() {
    this.isFocused = true;
    this.focusCount++;
    forceUpdate(this.host);
  }
  
  // Handle blur event
  handleBlur() {
    this.isFocused = false;
    this.blurCount++;
    forceUpdate(this.host);
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
    forceUpdate(this.host);
  }
}

