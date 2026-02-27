import { H, p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';

const MixinParent = class extends H {
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

const Mixin = class extends MixinParent {
    constructor() {
        this.prop1 = 'ExtendedCmp text';
        super();
    }
    prop1Changed(newValue) {
        console.info('extended class handler prop1:', newValue);
    }
};

const MixinCmp = /*@__PURE__*/ proxyCustomElement(class MixinCmp extends Mixin {
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
        return (h("div", { key: 'ec2b7a6f609d7af8e619ca970a1b75ff790a5a06' }, h("p", { key: '40c4f38f63f28d619340cb11f8ff2c86b6e73b18', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: 'ded9884b75e85a44f50d552859d29cd071658f86', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: 'f567a980c88dfe61b5c3cb2bbeeb8b21c1729d9f', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: '8e55a16812ca15aa72f9c7e320d18e1a91b6b364', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '7ae413adc0e6195a99bdef07637e2de47eb270ca', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
}, [512, "extends-abstract", {
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
    const components = ["extends-abstract"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-abstract":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MixinCmp);
            }
            break;
    } });
}

const ExtendsAbstract = MixinCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsAbstract, defineCustomElement };
