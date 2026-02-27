import { H, f as forceUpdate } from './index.js';

const ReactiveControllerHost = class extends H {
    constructor() {
        super(false);
    }
    controllers = new Set();
    addController(controller) {
        this.controllers.add(controller);
    }
    removeController(controller) {
        this.controllers.delete(controller);
    }
    connectedCallback() {
        this.controllers.forEach((controller) => controller.hostConnected?.());
    }
    disconnectedCallback() {
        this.controllers.forEach((controller) => controller.hostDisconnected?.());
    }
    componentWillLoad() {
        this.controllers.forEach((controller) => controller.hostWillLoad?.());
    }
    componentDidLoad() {
        this.controllers.forEach((controller) => controller.hostDidLoad?.());
    }
    componentWillRender() {
        this.controllers.forEach((controller) => controller.hostWillRender?.());
    }
    componentDidRender() {
        this.controllers.forEach((controller) => controller.hostDidRender?.());
    }
    componentWillUpdate() {
        this.controllers.forEach((controller) => controller.hostWillUpdate?.());
    }
    componentDidUpdate() {
        this.controllers.forEach((controller) => controller.hostDidUpdate?.());
    }
};

/**
 * ValidationController - demonstrates validation controller via composition
 *
 * This controller:
 * 1. Manages validation state (isValid, errorMessage)
 * 2. Provides method to get validation message data for rendering
 * 3. Can trigger validation (ideally on blur)
 * 4. Runs a callback provided by the host for validation logic
 */
class ValidationController {
    host;
    isValid = true;
    errorMessage = '';
    validationCallback;
    constructor(host) {
        this.host = host;
        host.addController(this);
    }
    // Lifecycle methods
    hostDidLoad() {
        // Setup validation on component load
        this.setupValidation();
    }
    hostDisconnected() {
        // Cleanup if needed
        this.cleanupValidation();
    }
    // Setup validation - can be overridden by host
    setupValidation() {
        // Default implementation - can be extended
    }
    cleanupValidation() {
        // Default implementation - can be extended
    }
    // Set the validation callback from host
    setValidationCallback(callback) {
        this.validationCallback = callback;
    }
    // Validate the value - returns true if valid, false otherwise
    validate(value) {
        if (!this.validationCallback) {
            this.isValid = true;
            this.errorMessage = '';
            forceUpdate(this.host);
            return true;
        }
        const error = this.validationCallback(value);
        this.isValid = !error;
        this.errorMessage = error || '';
        forceUpdate(this.host);
        return this.isValid;
    }
    // Trigger validation on blur
    handleBlur(value) {
        this.validate(value);
    }
    // Get validation state
    getValidationState() {
        return {
            isValid: this.isValid,
            errorMessage: this.errorMessage,
        };
    }
    // Get validation message data for rendering
    getValidationMessageData(helperTextId, errorTextId) {
        return {
            isValid: this.isValid,
            errorMessage: this.errorMessage,
            helperTextId,
            errorTextId,
            hasError: !!this.errorMessage,
        };
    }
    // Reset validation state
    resetValidation() {
        this.isValid = true;
        this.errorMessage = '';
        forceUpdate(this.host);
    }
}

/**
 * FocusController - demonstrates focus management controller via composition
 *
 * This controller:
 * 1. Manages focus state (isFocused, hasFocus)
 * 2. Tracks focus/blur events
 * 3. Provides methods to handle focus lifecycle
 */
class FocusController {
    host;
    isFocused = false;
    focusCount = 0;
    blurCount = 0;
    constructor(host) {
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
    setupFocusTracking() {
        // Default implementation - can be extended
    }
    cleanupFocusTracking() {
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

export { FocusController as F, ReactiveControllerHost as R, ValidationController as V };
//# sourceMappingURL=p-3P45Gqp1.js.map

//# sourceMappingURL=p-3P45Gqp1.js.map