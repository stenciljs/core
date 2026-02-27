import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const ConflictsBase = class extends H {
    constructor() {
        super(false);
    }
    // Duplicate properties that will be overridden in component
    duplicateProp = 'base prop value';
    duplicateState = 'base state value';
    // Non-duplicate properties for comparison
    baseOnlyProp = 'base only prop value';
    baseOnlyState = 'base only state value';
    // Tracking mechanism to verify which method is called
    methodCallLog = [];
    /**
     * Duplicate method that will be overridden in component
     */
    async duplicateMethod() {
        this.methodCallLog.push('duplicateMethod:base');
        return 'base method';
    }
    /**
     * Non-duplicate method for comparison
     */
    async baseOnlyMethod() {
        this.methodCallLog.push('baseOnlyMethod');
        return 'base only method';
    }
    /**
     * Method to get the call log for testing
     */
    async getMethodCallLog() {
        return [...this.methodCallLog];
    }
    /**
     * Method to reset call log for testing
     */
    async resetMethodCallLog() {
        this.methodCallLog = [];
    }
};

const ConflictsCmp = /*@__PURE__*/ proxyCustomElement(class ConflictsCmp extends ConflictsBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    get el() { return this; }
    // Duplicate @Prop - same name as base, should override
    duplicateProp = 'component prop value';
    // Duplicate @State - same name as base, should override
    duplicateState = 'component state value';
    // Component-specific properties
    componentOnlyState = 'component only state';
    // Tracking mechanism for component method calls
    componentMethodCallLog = [];
    /**
     * Duplicate method - same name as base, should override
     * Component version should be called, not base version
     */
    async duplicateMethod() {
        this.componentMethodCallLog.push('duplicateMethod:component');
        return 'component method';
    }
    /**
     * Method to update duplicate state for testing
     */
    async updateDuplicateState(value) {
        this.duplicateState = value;
    }
    /**
     * Method to update component-only state
     */
    async updateComponentOnlyState(value) {
        this.componentOnlyState = value;
    }
    /**
     * Method to get component method call log
     */
    async getComponentMethodCallLog() {
        return [...this.componentMethodCallLog];
    }
    /**
     * Method to reset component call log
     */
    async resetComponentMethodCallLog() {
        this.componentMethodCallLog = [];
    }
    /**
     * Method to get combined call log (base + component)
     */
    async getCombinedMethodCallLog() {
        const baseLog = await super.getMethodCallLog();
        return [...baseLog, ...this.componentMethodCallLog];
    }
    /**
     * Method to reset all call logs
     */
    async resetAllCallLogs() {
        await super.resetMethodCallLog();
        this.componentMethodCallLog = [];
    }
    render() {
        return (h("div", { key: '8c3bd271d46b550f6b4b49eb03df1e37d5eb1ad1', class: "container" }, h("h2", { key: '8cb50fe81c5aaea60149e9cd702b544eb2543190' }, "Decorator Conflicts Test"), h("div", { key: '44e0a79a2d0c267d2bb5027818c9303bfbaee7c7', class: "duplicate-props" }, h("h3", { key: '6193cbd259555e0c29057be164d0d699303348aa' }, "Duplicate @Prop (Component Override)"), h("p", { key: '33e6f34f3ca11770b83523e3f6c71475e3e3ca0b', class: "duplicate-prop-value" }, "Duplicate Prop: ", this.duplicateProp), h("p", { key: 'e03d627c3fddbf2e828f8ddb050ae8fbb82ca762', class: "expected-prop-value" }, "Expected: component prop value (component override)")), h("div", { key: 'f9fd0a8b79c7a7100b283a143a395ee06a2be13f', class: "duplicate-states" }, h("h3", { key: '0bf9918d9c96b340d3b1ba20a23dad827344924a' }, "Duplicate @State (Component Override)"), h("p", { key: 'ca3796b9759b2fad2efbadf5c76e4751651f8214', class: "duplicate-state-value" }, "Duplicate State: ", this.duplicateState), h("p", { key: '035196b6d4833f8bfa3703fced0ef46642373d38', class: "expected-state-value" }, "Expected: component state value (component override)")), h("div", { key: '81b855c005feca8ba1ccfeac1d62ff7ba6d5084f', class: "base-only-props" }, h("h3", { key: '247d76d5f8ab038846b9cf0838ada5728ecd3a58' }, "Base-Only Properties (Not Duplicated)"), h("p", { key: 'cc0d572c7569b8a38f1dd4cc4fe45d60e3bdde4c', class: "base-only-prop-value" }, "Base Only Prop: ", this.baseOnlyProp), h("p", { key: '25d4b7b11f27df40a811e19155cb801bf6afbe0f', class: "base-only-state-value" }, "Base Only State: ", this.baseOnlyState)), h("div", { key: '1ea083e782c6555f0bf009949c827e2db6277926', class: "component-only-state" }, h("h3", { key: '95a0ffff7ad2ebf05522258355a81a4c025303e3' }, "Component-Only State"), h("p", { key: '963db719c9f7882c99b5baa219c154e597476ec2', class: "component-only-state-value" }, "Component Only State: ", this.componentOnlyState)), h("div", { key: '2691d908f1f692264ec7262e37bce62cb2a4d1c3', class: "actions" }, h("button", { key: 'b36f3cfdb4a129d7fc97c9d8c454f4f38c722189', class: "update-duplicate-state", onClick: () => this.updateDuplicateState('duplicate state updated') }, "Update Duplicate State"), h("button", { key: 'b595c844a72a8c42042a98a6d84dd5c2fa822e54', class: "update-component-only-state", onClick: () => this.updateComponentOnlyState('component only updated') }, "Update Component Only State")), h("div", { key: '4475a6b5716d02723c4de1049a68f8d22e135130', class: "test-info" }, h("p", { key: 'b1c4b83f32669d5fbc874da6f6b50656ce86d2c1' }, "Features: Duplicate @Prop names | Duplicate @State names | Duplicate @Method names | Compiler precedence rules"))));
    }
}, [512, "extends-conflicts", {
        "baseOnlyProp": [1, "base-only-prop"],
        "duplicateProp": [1, "duplicate-prop"],
        "baseOnlyState": [32],
        "duplicateState": [32],
        "componentOnlyState": [32],
        "baseOnlyMethod": [64],
        "getMethodCallLog": [64],
        "resetMethodCallLog": [64],
        "duplicateMethod": [64],
        "updateDuplicateState": [64],
        "updateComponentOnlyState": [64],
        "getComponentMethodCallLog": [64],
        "resetComponentMethodCallLog": [64],
        "getCombinedMethodCallLog": [64],
        "resetAllCallLogs": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-conflicts"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-conflicts":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ConflictsCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsConflicts = ConflictsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsConflicts, defineCustomElement };
//# sourceMappingURL=extends-conflicts.js.map

//# sourceMappingURL=extends-conflicts.js.map