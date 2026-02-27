import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const MethodBase = class extends H {
    constructor() {
        super(false);
    }
    // Protected state that methods can manipulate
    internalValue = 'initial';
    callLog = [];
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
    }
    displayValue = 'waiting...';
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
        return (h("div", { key: '75c22d7af4efd82135206a260d181bacd1cc5825' }, h("h2", { key: '791e355a03427cb5e09917fdc500e137698a4d47' }, "Method Inheritance Test"), h("p", { key: 'c38bdd4de732a0e47ad25c1d4d23dc0504ee3c7b', class: "display-value" }, "Display: ", this.displayValue), h("div", { key: '7ead65d574cb76097ddd01f6ba2907e7f490fb9b', class: "info" }, h("p", { key: '77da034c52e6ebba740ee0de7961e6bef9368c22', class: "test-info" }, "Test @Method inheritance, super() calls, and method composition"), h("p", { key: 'b5ac707d9bf015871d6ee12043dd456844e132dd', class: "features" }, "Features: @Method inheritance | super() calls | Method override | Protected helpers"))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MethodsCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsMethods = MethodsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMethods, defineCustomElement };
//# sourceMappingURL=extends-methods.js.map

//# sourceMappingURL=extends-methods.js.map