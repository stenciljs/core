import { f as forceUpdate, M as Mixin } from './index.js';

const ValidationControllerMixin = (Base) => {
    const ValidationMixin = class extends Base {
        constructor() {
            super();
        }
        isValid = true;
        errorMessage = '';
        validationCallback;
        // Lifecycle methods
        componentDidLoad() {
            super.componentDidLoad?.();
            this.setupValidation();
        }
        disconnectedCallback() {
            super.disconnectedCallback?.();
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

/**
 * FocusControllerMixin - mixin factory for focus management functionality
 *
 * This mixin provides:
 * 1. Focus state management (isFocused, focusCount, blurCount)
 * 2. Focus tracking methods (handleFocus, handleBlur, etc.)
 * 3. Uses forceUpdate() directly for re-renders
 */
const FocusControllerMixin = (Base) => {
    const FocusMixin = class extends Base {
        constructor() {
            super();
        }
        isFocused = false;
        focusCount = 0;
        blurCount = 0;
        // Lifecycle methods
        componentDidLoad() {
            super.componentDidLoad?.();
            this.setupFocusTracking();
        }
        disconnectedCallback() {
            super.disconnectedCallback?.();
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

/**
 * FormFieldBase - combines ValidationControllerMixin and FocusControllerMixin
 *
 * This base class demonstrates how multiple controllers can be combined
 * via Mixin (multiple inheritance). Components can extend this to get both
 * validation and focus management functionality.
 */
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
//# sourceMappingURL=p-C2ris2BX.js.map

//# sourceMappingURL=p-C2ris2BX.js.map