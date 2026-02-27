import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const SiblingAbstractMixin = class extends H {
    constructor() {
        super(false);
        /**
         * Test getter/setter pattern - ensures default value is preserved
         * and not overwritten with undefined during component initialization.
         */
        this._getterProp = 'getter default value';
        this.prop1 = 'ExtendedCmp text';
        this.prop2 = 'ExtendedCmp prop2 text';
        this.state1 = 'ExtendedCmp state text';
        this.state2 = 'ExtendedCmp state2 text';
    }
    get getterProp() {
        return this._getterProp;
    }
    set getterProp(newValue) {
        this._getterProp = newValue;
    }
    prop1Changed(newValue) {
        console.info('extended class handler prop1:', newValue);
    }
    prop2Changed(newValue) {
        console.info('extended class handler prop2:', newValue);
    }
    state1Changed(newValue) {
        console.info('extended class handler state1:', newValue);
    }
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
        this.prop1 = 'default text';
        this.state1 = 'default state text';
    }
    prop1Changed(newValue) {
        console.info('main class handler prop1:', newValue);
    }
    state1Changed(newValue) {
        console.info('main class handler state1:', newValue);
    }
    async method1() {
        this.prop1 = 'main class method1 called';
    }
    render() {
        return (h("div", { key: '2fc0305fb3a70f17886cbb3a1ef65243f4146751' }, h("p", { key: '1157804afe91eb008d4248987a26caba394c8a04', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: 'ee031fd9efb4ab1f964c1bd8c2e01980c01cc94f', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: 'b87e50cba41981b08bbfae34c3fd1a30db4bbfa9', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: '199c36c06cac05da0ebb14c1829f956c43cb888d', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '1f980f037137a133275ce6d9e4f51d56ae3fe170', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExtendsExternalAbstract$1);
            }
            break;
    } });
}

const ExtendsExternalAbstract = ExtendsExternalAbstract$1;
const defineCustomElement = defineCustomElement$1;

export { ExtendsExternalAbstract, defineCustomElement };
