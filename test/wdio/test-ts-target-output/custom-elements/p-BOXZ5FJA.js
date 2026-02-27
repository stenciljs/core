import { t as transformTag, p as proxyCustomElement, H, h } from './index.js';

const ExtendedCmpCmp = /*@__PURE__*/ proxyCustomElement(class ExtendedCmpCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
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
    render() {
        return (h("div", { key: '33c9df73fafce9d8c30c2b111e2a6994ca672d31' }, h("p", { key: '1a3683ab71bde05f0fbfcc92e6d276718055608b', class: "extended-prop-1" }, "Base Extended class prop 1: ", this.prop1), h("p", { key: '691c9a96c62e6cd59cd6d25d2775a12be2393f82', class: "extended-prop-2" }, "Base Extended class prop 2: ", this.prop2), h("p", { key: 'f384306b08440024414f05b0d66ba4b1542e6f44', class: "extended-state-1" }, "Base Extended class state 1: ", this.state1), h("p", { key: '8987dc7058033db7c38cc2d827007abc74fdca83', class: "extended-state-2" }, "Base Extended class state 2: ", this.state2)));
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
}, [512, "extended-cmp-cmp", {
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
    const components = ["extended-cmp-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extended-cmp-cmp":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ExtendedCmpCmp);
            }
            break;
    } });
}
defineCustomElement();

export { ExtendedCmpCmp as E, defineCustomElement as d };
//# sourceMappingURL=p-BOXZ5FJA.js.map

//# sourceMappingURL=p-BOXZ5FJA.js.map