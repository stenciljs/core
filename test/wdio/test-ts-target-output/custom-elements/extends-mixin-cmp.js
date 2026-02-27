import { h, p as proxyCustomElement, M as Mixin, t as transformTag } from './index.js';

const MixinBFactory = (Base) => {
    const MixinB = class extends Base {
        constructor() {
            super();
        }
        prop3 = 'mixin b text';
        /**
         * Test getter/setter pattern in mixin - ensures default value is preserved
         * and not overwritten with undefined during component initialization.
         */
        _getterProp = 'getter default value';
        get getterProp() {
            return this._getterProp;
        }
        set getterProp(newValue) {
            this._getterProp = newValue;
        }
        prop3Changed(newValue) {
            console.info('mixin b handler prop3:', newValue);
        }
        state3 = 'mixin b state text';
        state3Changed(newValue) {
            console.info('mixin b handler state3:', newValue);
        }
        async method3() {
            this.prop3 = 'mixin b method3 called';
        }
        render() {
            return (h("div", null, h("p", { class: "mixin-b-prop-1" }, "Another class prop3: ", this.prop3), h("p", { class: "mixin-b-state-1" }, "Another class state3: ", this.state3), h("p", { class: "mixin-b-getter-prop" }, "Mixin getter prop: ", this.getterProp)));
        }
    };
    return MixinB;
};

const MixinAFactory = (Base) => {
    const MixinA = class extends Base {
        constructor() {
            super();
        }
        prop1 = 'MixinA text';
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
        render() {
            return (h("div", null, h("p", { class: "extended-prop-1" }, "Base Extended class prop 1: ", this.prop1), h("p", { class: "extended-prop-2" }, "Base Extended class prop 2: ", this.prop2), h("p", { class: "extended-state-1" }, "Base Extended class state 1: ", this.state1), h("p", { class: "extended-state-2" }, "Base Extended class state 2: ", this.state2)));
        }
    };
    return MixinA;
};

const MixinCmp = /*@__PURE__*/ proxyCustomElement(class MixinCmp extends Mixin(MixinAFactory, MixinBFactory) {
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
        return (h("div", { key: '6f8782b80678dbf8fab6d254f36e6a6040f98fd2' }, h("p", { key: '0621f489b79b4083aa6b3133e8bfa1ec297bf093', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '4a2687f8f9ef01d8439a2769b6e6ed9b7040bf2b', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: 'dcf658a097eaa0b56912013e5115e3baefc7daeb', class: "main-prop-3" }, "Main class prop3: ", this.prop3), h("p", { key: '96e5a08dfadbb3b1bb5970f47b36945336bfa87a', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'e50b2d19261834eb16fd6b91c4375f17dc14676e', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: 'e1dc813198077e50110da8073cbdc5e3dc18ba56', class: "main-state-2" }, "Main class state2: ", this.state2), h("p", { key: '52235e2f3981d3ccc139a9b834c89eae211cd510', class: "main-state-3" }, "Main class state3: ", this.state3)));
    }
    static get watchers() { return {
        "prop3": [{
                "prop3Changed": 0
            }],
        "state3": [{
                "state3Changed": 0
            }],
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
}, [512, "extends-mixin-cmp", {
        "prop3": [1, "prop-3"],
        "getterProp": [6145, "getter-prop"],
        "prop2": [1, "prop-2"],
        "prop1": [1, "prop-1"],
        "state3": [32],
        "state2": [32],
        "state1": [32],
        "method3": [64],
        "method2": [64],
        "method1": [64]
    }, undefined, {
        "prop3": [{
                "prop3Changed": 0
            }],
        "state3": [{
                "state3Changed": 0
            }],
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
    const components = ["extends-mixin-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-mixin-cmp":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), MixinCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsMixinCmp = MixinCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsMixinCmp, defineCustomElement };
//# sourceMappingURL=extends-mixin-cmp.js.map

//# sourceMappingURL=extends-mixin-cmp.js.map