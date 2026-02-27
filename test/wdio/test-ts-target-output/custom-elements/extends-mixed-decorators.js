import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const MixedDecoratorsBase = class extends H {
    constructor() {
        super(false);
    }
    // Properties that will conflict with different decorator types in component
    mixedName = 'base prop value';
    mixedStateName = 'base state value';
    // Non-conflicting properties for comparison
    baseOnlyProp = 'base only prop value';
    baseOnlyState = 'base only state value';
    // Tracking mechanism to verify which method is called
    methodCallLog = [];
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
    }
    get el() { return this; }
    // Mixed decorator type conflicts - same name, different decorator type
    // Base has @Prop, component has @State - component @State should override base @Prop
    mixedName = 'component state value';
    // Base has @State, component has @Prop - component @Prop should override base @State
    mixedStateName = 'component prop value';
    // Component-specific properties for comparison
    componentOnlyState = 'component only state';
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
        return (h("div", { key: '3a7a3d82ddf4c22ffbb94e8b5aa222cf93dc6d4c', class: "container" }, h("h2", { key: '332ce98e793a084e63e1d89f237f42d2d1245812' }, "Mixed Decorator Types Test"), h("div", { key: '0652c608f756188a956561f9d646cfdd7275e43d', class: "prop-state-conflict" }, h("h3", { key: 'a8a74fcb2f1d8b9bddc4e4f8e92c230fa298ce8c' }, "@Prop in Base, @State in Component (mixedName)"), h("p", { key: '457bd3e863af0f1de04124b7e4e0642167f6f0be', class: "mixed-name-value" }, "Mixed Name: ", this.mixedName), h("p", { key: '73cb930d0fb982a28cbf099b75311e4ea839543f', class: "mixed-name-type" }, "Expected: component state value (component @State overrides base @Prop)")), h("div", { key: '7788ceed62ac7704c3d61f9edcb104496ae3c418', class: "state-prop-conflict" }, h("h3", { key: '672f41abf57f2f5d1a5fc748b75983cb343285aa' }, "@State in Base, @Prop in Component (mixedStateName)"), h("p", { key: 'ff4cd2edf8128ff001573fdbb7a8c922c8a53cec', class: "mixed-state-name-value" }, "Mixed State Name: ", this.mixedStateName), h("p", { key: '0bf012f50f21f017b4cdab87d6ba3bab6dd0cabd', class: "mixed-state-name-type" }, "Expected: component prop value (component @Prop overrides base @State)")), h("div", { key: 'a7e7ca1ff9674e28cc49444677005a3e21aff8d6', class: "base-only-props" }, h("h3", { key: '904b5ec3c5f51f8d4b4f45669c7cb43984fd5504' }, "Base-Only Properties (Not Conflicted)"), h("p", { key: 'd7c47706ec3b2a6228fe0dd7f11bd6b063cefbc2', class: "base-only-prop-value" }, "Base Only Prop: ", this.baseOnlyProp), h("p", { key: '1a42f89b92a76b0610b0fd09ca3490bae0ebb1c9', class: "base-only-state-value" }, "Base Only State: ", this.baseOnlyState)), h("div", { key: '8232d45a87510b57a859255e5bc12efdad66eabf', class: "component-only-state" }, h("h3", { key: '5a6c14c8f45b507d3d2bd31c87ec8016f8799bb8' }, "Component-Only State"), h("p", { key: '7a202187150eb48bed3f9a29c12b2e9dc5943ce0', class: "component-only-state-value" }, "Component Only State: ", this.componentOnlyState)), h("div", { key: 'c2eb4dbad6924de7d7df04e3f9eba11f7d2511aa', class: "actions" }, h("button", { key: 'd6c334902865f7557e3ef31431e14ad2ef3b5ec4', class: "update-mixed-name", onClick: () => this.updateMixedName('mixed name updated') }, "Update Mixed Name (State)"), h("button", { key: '2b7ac91734271779289ca57017a83a6fa7648acd', class: "update-component-only-state", onClick: () => this.updateComponentOnlyState('component only updated') }, "Update Component Only State")), h("div", { key: 'f61ad46844108cb800bb66e19c86ae0e099e275e', class: "test-info" }, h("p", { key: '3d812cac85748ab629adab556214592a52df27f7' }, "Features: @Prop/@State conflicts | @State/@Prop conflicts | Runtime behavior"))));
    }
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MixedDecoratorsCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsMixedDecorators = MixedDecoratorsCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMixedDecorators, defineCustomElement };
//# sourceMappingURL=extends-mixed-decorators.js.map

//# sourceMappingURL=extends-mixed-decorators.js.map