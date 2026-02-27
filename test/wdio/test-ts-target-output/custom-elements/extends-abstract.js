import { H, t as transformTag, p as proxyCustomElement, h } from './index.js';

const MixinParent = class extends H {
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

const Mixin = class extends MixinParent {
    constructor() {
        super();
    }
    prop1 = 'ExtendedCmp text';
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
        return (h("div", { key: '3b3122f3d0c87021419462d9fc611665b6863343' }, h("p", { key: '3ddbc235255e0f3e745d3fac56be0c9a6c3c0b62', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '556576c62832fd19c88ed1ffc41ac4ce55c8d816', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '501ba319dcaefd533e3f6af70ca404e83774b63b', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: '70a5be2e8ff4ba58e02b5f337460f261a9c77712', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '650b4cddd37cdeed97d3137a4d70725364cb5cbb', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MixinCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsAbstract = MixinCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsAbstract, defineCustomElement };
//# sourceMappingURL=extends-abstract.js.map

//# sourceMappingURL=extends-abstract.js.map