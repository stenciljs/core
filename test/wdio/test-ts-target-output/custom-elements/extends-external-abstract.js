import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const SiblingAbstractMixin = class extends H {
    constructor() {
        super(false);
    }
    /**
     * Test getter/setter pattern - ensures default value is preserved
     * and not overwritten with undefined during component initialization.
     */
    _getterProp = 'getter default value';
    get getterProp() {
        return this._getterProp;
    }
    set getterProp(newValue) {
        this._getterProp = newValue;
    }
    prop1 = 'ExtendedCmp text';
    prop1Changed(newValue) {
        console.info('extended class handler prop1:', newValue);
    }
    prop2 = 'ExtendedCmp prop2 text';
    prop2Changed(newValue) {
        console.info('extended class handler prop2:', newValue);
    }
    state1 = 'ExtendedCmp state text';
    state1Changed(newValue) {
        console.info('extended class handler state1:', newValue);
    }
    state2 = 'ExtendedCmp state2 text';
    state2Changed(newValue) {
        console.info('extended class handler state2:', newValue);
    }
    async method1() {
        this.prop1 = 'ExtendedCmp method1 called';
    }
    async method2() {
        this.prop1 = 'ExtendedCmp method2 called';
    }
};

const ExtendsExternalAbstract$1 = /*@__PURE__*/ proxyCustomElement(class ExtendsExternalAbstract extends SiblingAbstractMixin {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    prop1 = 'default text';
    prop1Changed(newValue) {
        console.info('main class handler prop1:', newValue);
    }
    state1 = 'default state text';
    state1Changed(newValue) {
        console.info('main class handler state1:', newValue);
    }
    async method1() {
        this.prop1 = 'main class method1 called';
    }
    render() {
        return (h("div", { key: '2b956a85232f38251bc3ec65e4ef1afe9cdea92c' }, h("p", { key: '4d1912aa3de2a9237804a75ba5df4a09fc3049a0', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '634f47e21b27cf596602c8e0ec37f4e3afd18911', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '9d32a6816b680c1aaac0bf19c0617b7f7c2f1764', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'a4dddd1c63c11c4490b881469535d012a59f40e0', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '1009009ef0873a920cc38a0aceed666523acc2a7', class: "main-state-2" }, "Main class state2: ", this.state2)));
    }
    static get watchers() { return {
        "prop2": [{
                "prop2Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }],
        "prop1": [{
                "prop1Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }]
    }; }
}, [512, "extends-external-abstract", {
        "getterProp": [6145, "getter-prop"],
        "prop2": [1, "prop-2"],
        "prop1": [1, "prop-1"],
        "state2": [32],
        "state1": [32],
        "method2": [64],
        "method1": [64]
    }, undefined, {
        "prop2": [{
                "prop2Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }],
        "prop1": [{
                "prop1Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-external-abstract"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-external-abstract":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ExtendsExternalAbstract$1);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsExternalAbstract = ExtendsExternalAbstract$1;
const defineCustomElement = defineCustomElement$1;

export { ExtendsExternalAbstract, defineCustomElement };
//# sourceMappingURL=extends-external-abstract.js.map

//# sourceMappingURL=extends-external-abstract.js.map