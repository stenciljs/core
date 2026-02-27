import { f as forceUpdate, M as Mixin } from './p-DYdAJnXF.js';

const ValidationControllerMixin = (Base) => {
    const ValidationMixin = class extends Base {
        constructor() {
            this.isValid = true;
            this.errorMessage = '';
            super();
        }
        // Lifecycle methods
        componentDidLoad() {
            var _a;
            (_a = super.componentDidLoad) === null || _a === void 0 ? void 0 : _a.call(this);
            this.setupValidation();
        }
        disconnectedCallback() {
            var _a;
            (_a = super.disconnectedCallback) === null || _a === void 0 ? void 0 : _a.call(this);
            this.cleanupValidation();
        }
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
                forceUpdate(this);
                return true;
            }
            const error = this.validationCallback(value);
            this.isValid = !error;
            this.errorMessage = error || '';
            forceUpdate(this);
            return this.isValid;
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
            const { isValid, errorMessage } = this.getValidationState();
            return {
                isValid,
                errorMessage,
                helperTextId,
                errorTextId,
                hasError: !!errorMessage,
            };
        }
        // Reset validation state
        resetValidation() {
            this.isValid = true;
            this.errorMessage = '';
            forceUpdate(this);
        }
    };
    return ValidationMixin;
};

const FocusControllerMixin = (Base) => {
    const FocusMixin = class extends Base {
        constructor() {
            this.isFocused = false;
            this.focusCount = 0;
            this.blurCount = 0;
            super();
        }
        // Lifecycle methods
        componentDidLoad() {
            var _a;
            (_a = super.componentDidLoad) === null || _a === void 0 ? void 0 : _a.call(this);
            this.setupFocusTracking();
        }
        disconnectedCallback() {
            var _a;
            (_a = super.disconnectedCallback) === null || _a === void 0 ? void 0 : _a.call(this);
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
            forceUpdate(this);
        }
        // Handle blur event
        handleBlur() {
            this.isFocused = false;
            this.blurCount++;
            forceUpdate(this);
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
            forceUpdate(this);
        }
    };
    return FocusMixin;
};

const FormFieldBase = class extends Mixin(ValidationControllerMixin, FocusControllerMixin) {
    constructor() {
        super(false);
    }
    // Convenience methods that combine both controllers
    handleFocusEvent() {
        this.handleFocus(); // From FocusControllerMixin
    }
    handleBlurEvent(value) {
        this.handleBlur(); // From FocusControllerMixin (no params)
        this.validate(value); // From ValidationControllerMixin
    }
};

export { FormFieldBase as F };
