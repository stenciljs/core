import { p as proxyCustomElement, M as Mixin, h, t as transformTag } from './p-DYdAJnXF.js';

var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m")
        throw new TypeError("Private method is not writable");
    if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
/**
 * A mixin factory function that returns a class with Stencil decorators.
 * This tests the scenario where a component in an external library uses
 * a mixin pattern internally.
 */
const SiblingMixinFactory = (Base) => {
    var _SiblingMixin__getterProp;
    const SiblingMixin = class extends Base {
        constructor() {
            super();
            /**
             * Test getter/setter pattern - ensures default value is preserved
             * and not overwritten with undefined during component initialization.
             * Using JS private field (#) instead of TS private to avoid declaration emit issues.
             */
            _SiblingMixin__getterProp.set(this, 'getter default value');
            this.prop1 = 'ExtendedCmp text';
            this.prop2 = 'ExtendedCmp prop2 text';
            this.state1 = 'ExtendedCmp state text';
            this.state2 = 'ExtendedCmp state2 text';
        }
        get getterProp() {
            return __classPrivateFieldGet(this, _SiblingMixin__getterProp, "f");
        }
        set getterProp(newValue) {
            __classPrivateFieldSet(this, _SiblingMixin__getterProp, newValue, "f");
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
    _SiblingMixin__getterProp = new WeakMap();
    return SiblingMixin;
};

const SiblingWithMixin = /*@__PURE__*/ proxyCustomElement(class SiblingWithMixin extends Mixin(SiblingMixinFactory) {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '8856ed4fc1d3183eeba2304df951aa4fba233960' }, h("p", { key: '7d36bad927e997119065a29c27ed2286a5e7c852', class: "extended-prop-1" }, "Extended class prop 1: ", this.prop1), h("p", { key: '60baaddb2499a18a5eb97c98376f425aeebe5038', class: "extended-prop-2" }, "Extended class prop 2: ", this.prop2), h("p", { key: '3be7d4a4b66fc848a34df531f0e9e7dd1ab9e438', class: "extended-state-1" }, "Extended class state 1: ", this.state1), h("p", { key: 'da992ae915419a330c1ce724f2658a83c12d7188', class: "extended-state-2" }, "Extended class state 2: ", this.state2)));
    }
    static get watchers() { return {
        "prop1": [{
                "prop1Changed": 0
            }],
        "prop2": [{
                "prop2Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }]
    }; }
}, [512, "sibling-with-mixin", {
        "getterProp": [6145, "getter-prop"],
        "prop1": [1, "prop-1"],
        "prop2": [1, "prop-2"],
        "state1": [32],
        "state2": [32],
        "method1": [64],
        "method2": [64]
    }, undefined, {
        "prop1": [{
                "prop1Changed": 0
            }],
        "prop2": [{
                "prop2Changed": 0
            }],
        "state1": [{
                "state1Changed": 0
            }],
        "state2": [{
                "state2Changed": 0
            }]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["sibling-with-mixin"];
    components.forEach(tagName => { switch (tagName) {
        case "sibling-with-mixin":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SiblingWithMixin);
            }
            break;
    } });
}

export { SiblingWithMixin as S, defineCustomElement as d };
