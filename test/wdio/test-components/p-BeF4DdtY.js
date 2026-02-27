import { H, f as forceUpdate } from './p-DYdAJnXF.js';

const ReactiveControllerHost = class extends H {
    constructor() {
        super(false);
        this.controllers = new Set();
    }
    addController(controller) {
        this.controllers.add(controller);
    }
    removeController(controller) {
        this.controllers.delete(controller);
    }
    connectedCallback() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostConnected) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    disconnectedCallback() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDisconnected) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentWillLoad() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostWillLoad) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentDidLoad() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDidLoad) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentWillRender() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostWillRender) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentDidRender() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDidRender) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentWillUpdate() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostWillUpdate) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
    componentDidUpdate() {
        this.controllers.forEach((controller) => { var _a; return (_a = controller.hostDidUpdate) === null || _a === void 0 ? void 0 : _a.call(controller); });
    }
};

class ValidationController {
    constructor(host) {
        this.isValid = true;
        this.errorMessage = '';
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

class FocusController {
    constructor(host) {
        this.isFocused = false;
        this.focusCount = 0;
        this.blurCount = 0;
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
