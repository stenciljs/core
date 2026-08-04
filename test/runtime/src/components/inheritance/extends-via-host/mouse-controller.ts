import { ReactiveController, ReactiveControllerHost } from './reactive-controller-host.js';

/**
 * A reactive controller that tracks mouse position.
 * This demonstrates the controller pattern for encapsulating
 * reusable behavior that can request component updates.
 */
export class MouseController implements ReactiveController {
  host: ReactiveControllerHost;
  pos = { x: 0, y: 0 };

  // Test hooks to verify lifecycle methods were called
  _hostConnectedCalled = false;
  _hostDisconnectedCalled = false;

  private _onMouseMove = ({ clientX, clientY }: MouseEvent) => {
    this.pos = { x: clientX, y: clientY };
    this.host.requestUpdate();
  };

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    this._hostConnectedCalled = true;
    // Store in window for test verification
    (window as any).__mouseControllerConnected = true;
    window.addEventListener('mousemove', this._onMouseMove);
  }

  hostDisconnected(): void {
    this._hostDisconnectedCalled = true;
    // Store in window for test verification (component may be removed from DOM)
    (window as any).__mouseControllerDisconnected = true;
    window.removeEventListener('mousemove', this._onMouseMove);
  }
}
