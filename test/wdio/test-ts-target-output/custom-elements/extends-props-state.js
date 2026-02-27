import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const PropsStateBase = class extends H {
    constructor() {
        super(false);
    }
    // Base @Prop - inherited by component
    baseProp = 'base prop value';
    // Base @Prop with different type
    baseCount = 0;
    // Base @State - inherited by component, should trigger reactivity
    baseState = 'base state value';
    // Base @State with boolean type
    baseEnabled = true;
};

const PropsStateCmp = /*@__PURE__*/ proxyCustomElement(class PropsStateCmp extends PropsStateBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    // Component-specific @Prop (in addition to inherited baseProp, baseCount)
    componentProp = 'component prop value';
    // Component-specific @State (in addition to inherited baseState, baseEnabled)
    componentState = 'component state value';
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
        return (h("div", { key: '735e885fe9a36ede943bc62fbd7ec56b9af0e92b', class: "container" }, h("h2", { key: '8c9e969395f9ed778aea09f151148d14da8bf500' }, "Props & State Inheritance Test"), h("div", { key: '0ff01fb2d34b9614b20b817fff0e1d79eaa979b0', class: "inherited-props" }, h("h3", { key: '1615326211da5dbb12af57843bb5a970c596f23f' }, "Inherited Props"), h("p", { key: '0dd176c9d39c8068be2ada6e11be4e618af46e76', class: "base-prop" }, "Base Prop: ", this.baseProp), h("p", { key: '0c0abb0f140959721cf7b059cf254d8da8d4e63e', class: "base-count" }, "Base Count: ", this.baseCount)), h("div", { key: '0f5537f4b943cfe7d47bfb2774cbd7a42796a6b4', class: "inherited-state" }, h("h3", { key: '1dfe132d1b763591dbb56cfaef19129b5f06ddd6' }, "Inherited State"), h("p", { key: '1bc29f509944d08af207c4b3eab3272eadbf35d0', class: "base-state" }, "Base State: ", this.baseState), h("p", { key: 'a35c9c242822cb4f80a2262553ae1846b264d1e8', class: "base-enabled" }, "Base Enabled: ", this.baseEnabled ? 'true' : 'false')), h("div", { key: '194baec34d6e61f3a3280b4ac5137c51bdc704b0', class: "component-props" }, h("h3", { key: 'd8c80a5e94ad7b73fdd81c57ce97dc73a9fe0044' }, "Component Props"), h("p", { key: '536f7fba0dec6e1df67ac5b8f27bb92e8ca6a5d2', class: "component-prop" }, "Component Prop: ", this.componentProp)), h("div", { key: 'c0882d80730449963be6f9d4101ce20f86109b5e', class: "component-state" }, h("h3", { key: '30ca5382cf9407e1417efbf0a7aea7cfb6938fd4' }, "Component State"), h("p", { key: 'e5854a7d06ebbfa5cc46e32483d9033665baa7a3', class: "component-state-value" }, "Component State: ", this.componentState)), h("div", { key: '0ce3ee53f66ba358f95574f11586291a0f6b5943', class: "actions" }, h("button", { key: '35906bae83da149b1149a4a3c789a82d45444ec5', class: "update-base-state", onClick: () => this.updateBaseState('base state updated') }, "Update Base State"), h("button", { key: 'deda181fca2c39668400b11e8ec0399c88690ac1', class: "update-component-state", onClick: () => this.updateComponentState('component state updated') }, "Update Component State"), h("button", { key: '4fc883975950f1afdeaf45ab8c60d8900dc0e89b', class: "toggle-base-enabled", onClick: () => this.toggleBaseEnabled() }, "Toggle Base Enabled"), h("button", { key: '6eae9c5d5d244b30862a0dbe4b04547e60d686fd', class: "increment-base-count", onClick: () => this.incrementBaseCount() }, "Increment Base Count"))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), PropsStateCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsPropsState = PropsStateCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsPropsState, defineCustomElement };
//# sourceMappingURL=extends-props-state.js.map

//# sourceMappingURL=extends-props-state.js.map