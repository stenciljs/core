import type {
    ReactiveControllerHost,
    ReactiveController,
  } from "./reactive-controller-host.js";
  
  export class MouseController implements ReactiveController {
    constructor(host: ReactiveControllerHost) {
        this.host = host;
        host.addController(this);
    }

    private host: ReactiveControllerHost;
    pos = { x: 0, y: 0 };
    
    // Test hooks to verify lifecycle methods were called
    _hostConnectedCalled = false;
    _hostDisconnectedCalled = false;
  
    _onMouseMove = ({ clientX, clientY }: MouseEvent) => {
      this.pos = { x: clientX, y: clientY };
      this.host.requestUpdate();
    };
  
    hostConnected() {
      this._hostConnectedCalled = true;
      // Store in window for test verification
      (window as any).__mouseControllerConnected = true;
      window.addEventListener("mousemove", this._onMouseMove);
    }
  
    hostDisconnected() {
      this._hostDisconnectedCalled = true;
      // Store in window for test verification (component may be removed from DOM)
      (window as any).__mouseControllerDisconnected = true;
      window.removeEventListener("mousemove", this._onMouseMove);
    }
  }
  