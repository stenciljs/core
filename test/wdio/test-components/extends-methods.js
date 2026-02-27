import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const MethodBase = class extends H {
    constructor() {
        super(false);
        // Protected state that methods can manipulate
        this.internalValue = 'initial';
        this.callLog = [];
    }
    /**
     * Base method that can be called by child components
     */
    async baseMethod() {
        this.callLog.push('baseMethod');
        this.internalValue = 'baseMethod called';
        return 'base';
    }
    /**
     * Method that will be overridden in child, with super() call
     */
    async overridableMethod() {
        this.callLog.push('overridableMethod:base');
        this.internalValue = 'base implementation';
        return 'base-overridable';
    }
    /**
     * Protected helper method for composition
     */
    formatValue(prefix) {
        return `${prefix}: ${this.internalValue}`;
    }
    /**
     * Method to get the call log for testing
     */
    async getCallLog() {
        return [...this.callLog];
    }
    /**
     * Method to get internal value for testing
     */
    async getInternalValue() {
        return this.internalValue;
    }
    /**
     * Method to reset state for testing
     */
    async reset() {
        this.internalValue = 'initial';
        this.callLog = [];
    }
};

const MethodsCmp = /*@__PURE__*/ proxyCustomElement(class MethodsCmp extends MethodBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.displayValue = 'waiting...';
    }
    /**
     * Child-specific method that uses parent's protected helper
     */
    async childMethod() {
        this.callLog.push('childMethod');
        this.internalValue = 'childMethod called';
        this.displayValue = this.formatValue('Child');
        return 'child';
    }
    /**
     * Override parent method with super() call
     */
    async overridableMethod() {
        // Call parent implementation
        const baseResult = await super.overridableMethod();
        // Add child behavior
        this.callLog.push('overridableMethod:child');
        this.internalValue = 'child override with super';
        this.displayValue = this.formatValue('Override');
        return `${baseResult}+child`;
    }
    /**
     * Method that composes parent and child behavior
     */
    async composedMethod() {
        // Call parent method
        await this.baseMethod();
        // Add child behavior
        this.callLog.push('composedMethod:child');
        const composed = `${this.internalValue} + child composition`;
        this.internalValue = composed;
        this.displayValue = this.formatValue('Composed');
        return composed;
    }
    /**
     * Method to trigger display update from test
     */
    async updateDisplay(value) {
        this.displayValue = value;
    }
    render() {
        return (h("div", { key: '713b511ab601cdef1d737e0693bac15612d6031f' }, h("h2", { key: 'f7f730974a7f3ad409fe9a0381e0ce107d2f34b6' }, "Method Inheritance Test"), h("p", { key: 'c6b8799bbe2ddc1543657113c243abfd2cb17042', class: "display-value" }, "Display: ", this.displayValue), h("div", { key: '3c1e78db08e1cd9ac53649facf12d3ad33f7460f', class: "info" }, h("p", { key: '1792db4dde3c8cc977333bb1117285e6d3091d05', class: "test-info" }, "Test @Method inheritance, super() calls, and method composition"), h("p", { key: 'f2b4bb52ab1e9badca8c969ff9495ab599d37482', class: "features" }, "Features: @Method inheritance | super() calls | Method override | Protected helpers"))));
    }
}, [512, "extends-methods", {
        "displayValue": [32],
        "baseMethod": [64],
        "getCallLog": [64],
        "getInternalValue": [64],
        "reset": [64],
        "childMethod": [64],
        "overridableMethod": [64],
        "composedMethod": [64],
        "updateDisplay": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-methods"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-methods":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MethodsCmp);
            }
            break;
    } });
}

const ExtendsMethods = MethodsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMethods, defineCustomElement };
