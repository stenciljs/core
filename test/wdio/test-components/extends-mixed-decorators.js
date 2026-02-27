import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const MixedDecoratorsBase = class extends H {
    constructor() {
        super(false);
        // Properties that will conflict with different decorator types in component
        this.mixedName = 'base prop value';
        this.mixedStateName = 'base state value';
        // Non-conflicting properties for comparison
        this.baseOnlyProp = 'base only prop value';
        this.baseOnlyState = 'base only state value';
        // Tracking mechanism to verify which method is called
        this.methodCallLog = [];
    }
    /**
     * Method that will conflict with @Prop in component
     */
    async mixedMethodName() {
        this.methodCallLog.push('mixedMethodName:base');
        return 'base method';
    }
    /**
     * Non-conflicting method for comparison
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

const MixedDecoratorsCmp = /*@__PURE__*/ proxyCustomElement(class MixedDecoratorsCmp extends MixedDecoratorsBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // Mixed decorator type conflicts - same name, different decorator type
        // Base has @Prop, component has @State - component @State should override base @Prop
        this.mixedName = 'component state value';
        // Base has @State, component has @Prop - component @Prop should override base @State
        this.mixedStateName = 'component prop value';
        // Component-specific properties for comparison
        this.componentOnlyState = 'component only state';
    }
    /**
     * Method to update mixedName state for testing
     */
    async updateMixedName(value) {
        this.mixedName = value;
    }
    /**
     * Method to update component-only state
     */
    async updateComponentOnlyState(value) {
        this.componentOnlyState = value;
    }
    render() {
        return (h("div", { key: '4985123ccc53721250845a6d98ba39cff0f0f1e9', class: "container" }, h("h2", { key: '2548a6101909581b50202ddc36d6b95d4484799d' }, "Mixed Decorator Types Test"), h("div", { key: 'b35f49dc182abe7592e14f80f407bb58a9ddd742', class: "prop-state-conflict" }, h("h3", { key: '027203ef723396df61ee78a24f482dfe02db17a1' }, "@Prop in Base, @State in Component (mixedName)"), h("p", { key: '42b1f1658af62d5e45e4206c7d4e3a8a308975b1', class: "mixed-name-value" }, "Mixed Name: ", this.mixedName), h("p", { key: '9db0b683095ef2ec0b56111979f1fa7d832cd73a', class: "mixed-name-type" }, "Expected: component state value (component @State overrides base @Prop)")), h("div", { key: '86302e1d9095904b92411a4c15e8b5e810d3f99c', class: "state-prop-conflict" }, h("h3", { key: 'ee2bff62fdf7a1253fb735d9ad12b2b8b10c81ab' }, "@State in Base, @Prop in Component (mixedStateName)"), h("p", { key: '516b7c8b829aa6bb2d288f059e3022d50ff6c0ae', class: "mixed-state-name-value" }, "Mixed State Name: ", this.mixedStateName), h("p", { key: '3ff4e751bf861e0a20088cc6e944854dff737f01', class: "mixed-state-name-type" }, "Expected: component prop value (component @Prop overrides base @State)")), h("div", { key: '37d35584061f502d7456b87e87f59918029cc05c', class: "base-only-props" }, h("h3", { key: '6562d5983e4521cdd8d941a4ea04547f2ee8e13c' }, "Base-Only Properties (Not Conflicted)"), h("p", { key: 'd3b0aff04e5d05a2975210f9c129e8442b2ea5d1', class: "base-only-prop-value" }, "Base Only Prop: ", this.baseOnlyProp), h("p", { key: '5481806894c17f40849a9f16d7de4793be9b407f', class: "base-only-state-value" }, "Base Only State: ", this.baseOnlyState)), h("div", { key: 'fe007647e9bb389221ca069666dbcedf84a4ea53', class: "component-only-state" }, h("h3", { key: '731c0a067ccb975f4c0ceddd7c25b1646155a0ff' }, "Component-Only State"), h("p", { key: 'f706ada70eaa0c6c1849860ab7f03763398521b3', class: "component-only-state-value" }, "Component Only State: ", this.componentOnlyState)), h("div", { key: 'a8da9553ec7704d2bd548df5d5b11a74d5de55ff', class: "actions" }, h("button", { key: '39abcef61404face3c27d1a34b50abe8132bcd0a', class: "update-mixed-name", onClick: () => this.updateMixedName('mixed name updated') }, "Update Mixed Name (State)"), h("button", { key: '0b40d7581259867236ddeb7141df6193746dba7a', class: "update-component-only-state", onClick: () => this.updateComponentOnlyState('component only updated') }, "Update Component Only State")), h("div", { key: '746ab01161900d808588b4d45734fa21a5740663', class: "test-info" }, h("p", { key: 'b444507fd96702b62e45a024eaa063c200e1c979' }, "Features: @Prop/@State conflicts | @State/@Prop conflicts | Runtime behavior"))));
    }
    get el() { return this; }
}, [512, "extends-mixed-decorators", {
        "mixedName": [32],
        "baseOnlyProp": [1, "base-only-prop"],
        "mixedStateName": [32],
        "baseOnlyState": [32],
        "componentOnlyState": [32],
        "mixedMethodName": [64],
        "baseOnlyMethod": [64],
        "getMethodCallLog": [64],
        "resetMethodCallLog": [64],
        "updateMixedName": [64],
        "updateComponentOnlyState": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-mixed-decorators"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-mixed-decorators":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MixedDecoratorsCmp);
            }
            break;
    } });
}

const ExtendsMixedDecorators = MixedDecoratorsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMixedDecorators, defineCustomElement };
