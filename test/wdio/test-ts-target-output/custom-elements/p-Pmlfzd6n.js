import { p as proxyCustomElement, M as Mixin, h, t as transformTag } from './index.js';

/**
 * A mixin factory function that returns a class with Stencil decorators.
 * This tests the scenario where a component in an external library uses
 * a mixin pattern internally.
 */
const SiblingMixinFactory = (Base) => {
    const SiblingMixin = class extends Base {
        constructor() {
            super();
        }
        /**
         * Test getter/setter pattern - ensures default value is preserved
         * and not overwritten with undefined during component initialization.
         * Using JS private field (#) instead of TS private to avoid declaration emit issues.
         */
        #_getterProp = 'getter default value';
        get getterProp() {
            return this.#_getterProp;
        }
        set getterProp(newValue) {
            this.#_getterProp = newValue;
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), SiblingWithMixin);
            }
            break;
    } });
}
defineCustomElement();

export { SiblingWithMixin as S, defineCustomElement as d };
//# sourceMappingURL=p-Pmlfzd6n.js.map

//# sourceMappingURL=p-Pmlfzd6n.js.map