import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const PropsStateBase = class extends H {
    constructor() {
        super(false);
        // Base @Prop - inherited by component
        this.baseProp = 'base prop value';
        // Base @Prop with different type
        this.baseCount = 0;
        // Base @State - inherited by component, should trigger reactivity
        this.baseState = 'base state value';
        // Base @State with boolean type
        this.baseEnabled = true;
    }
};

const PropsStateCmp = /*@__PURE__*/ proxyCustomElement(class PropsStateCmp extends PropsStateBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        // Component-specific @Prop (in addition to inherited baseProp, baseCount)
        this.componentProp = 'component prop value';
        // Component-specific @State (in addition to inherited baseState, baseEnabled)
        this.componentState = 'component state value';
    }
    // Method to update inherited state (tests reactivity of inherited @State)
    async updateBaseState(value) {
        this.baseState = value;
    }
    // Method to update component state (tests reactivity of component @State)
    async updateComponentState(value) {
        this.componentState = value;
    }
    // Method to toggle inherited boolean state
    async toggleBaseEnabled() {
        this.baseEnabled = !this.baseEnabled;
    }
    // Method to increment inherited number prop
    async incrementBaseCount() {
        this.baseCount++;
    }
    render() {
        return (h("div", { key: '5c1eec878fda5a697ad8bd2110bbd6289195b35b', class: "container" }, h("h2", { key: 'cebd5e410040076023b109110f0bc0ef9d327147' }, "Props & State Inheritance Test"), h("div", { key: 'af0ecc39db8683951c7b9bcaa73a22cfe574d8cc', class: "inherited-props" }, h("h3", { key: '57d90b9cff776df0fe6a8c791f85ae55b40b2f13' }, "Inherited Props"), h("p", { key: '9b050051617f9ac3e36d5119a7d83a5646840151', class: "base-prop" }, "Base Prop: ", this.baseProp), h("p", { key: '3b8861ffd827d128af1e71fc837e9533343c3154', class: "base-count" }, "Base Count: ", this.baseCount)), h("div", { key: 'c7c39f28090b21f94df215bfe35840499f236bba', class: "inherited-state" }, h("h3", { key: 'ece395ce8e149f3c9ba03f1c348898242b43ea55' }, "Inherited State"), h("p", { key: '94c4f949f26877f879a129d3e3ba4f15c3bb15b5', class: "base-state" }, "Base State: ", this.baseState), h("p", { key: 'a97666f5c162e310f36aa9c3327e8df184799a50', class: "base-enabled" }, "Base Enabled: ", this.baseEnabled ? 'true' : 'false')), h("div", { key: '4e5ea393766073d4f16c89f9178abc2fa37c074b', class: "component-props" }, h("h3", { key: '4655b62a73b6540bc8e2d8af34aa78c8d43c6519' }, "Component Props"), h("p", { key: 'b2c6da2b47ebe662e876270d113ea56718caee3b', class: "component-prop" }, "Component Prop: ", this.componentProp)), h("div", { key: 'bcf6abf6ba4b3dc4544ec0256696c113e2b2456b', class: "component-state" }, h("h3", { key: 'a914bdedcfd36ca2414ef8d2b78c632ca9417f75' }, "Component State"), h("p", { key: '142067552aa06833153e1fe8a17103089c2eae03', class: "component-state-value" }, "Component State: ", this.componentState)), h("div", { key: 'b5d19fadbcec03541b207fa0174b6d427ffc133a', class: "actions" }, h("button", { key: 'c76933bf312f035421fe3334086afb1d348d8690', class: "update-base-state", onClick: () => this.updateBaseState('base state updated') }, "Update Base State"), h("button", { key: '364b8383aad4af15ff2189c0ea6e5abbda332366', class: "update-component-state", onClick: () => this.updateComponentState('component state updated') }, "Update Component State"), h("button", { key: '218c2542120095a76cf7d62f9bdc129b78279880', class: "toggle-base-enabled", onClick: () => this.toggleBaseEnabled() }, "Toggle Base Enabled"), h("button", { key: '1700696be8e3c6485005302e4cb4315e94520d4e', class: "increment-base-count", onClick: () => this.incrementBaseCount() }, "Increment Base Count"))));
    }
}, [512, "extends-props-state", {
        "baseProp": [1, "base-prop"],
        "baseCount": [2, "base-count"],
        "componentProp": [1, "component-prop"],
        "baseState": [32],
        "baseEnabled": [32],
        "componentState": [32],
        "updateBaseState": [64],
        "updateComponentState": [64],
        "toggleBaseEnabled": [64],
        "incrementBaseCount": [64]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-props-state"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-props-state":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PropsStateCmp);
            }
            break;
    } });
}

const ExtendsPropsState = PropsStateCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsPropsState, defineCustomElement };
