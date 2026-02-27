import { t as transformTag, p as proxyCustomElement, h } from './index.js';
import { E as ExtendedCmpCmp } from './p-BOXZ5FJA.js';

const ExtendedCmp = /*@__PURE__*/ proxyCustomElement(class ExtendedCmp extends ExtendedCmpCmp {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '3cb7fba96e85a2a6f8b9324e9df312bec780792f' }, h("p", { key: '12bd832adf8f3347eb1075bed78f6bc8c61e9ae2', class: "extended-prop-1" }, "Extended class prop 1: ", this.prop1), h("p", { key: '8b86c4f51a50154bfb090a83031c92e22f4322c2', class: "extended-prop-2" }, "Extended class prop 2: ", this.prop2), h("p", { key: 'c7d76b17f0e5814335252f3c517ada16003710b1', class: "extended-state-1" }, "Extended class state 1: ", this.state1), h("p", { key: '179fffadcc44dfa723d9b0311afd9e6fefabf894', class: "extended-state-2" }, "Extended class state 2: ", this.state2)));
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
}, [512, "extended-cmp", {
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
    const components = ["extended-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extended-cmp":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ExtendedCmp);
            }
            break;
    } });
}
defineCustomElement();

export { ExtendedCmp as E, defineCustomElement as d };
//# sourceMappingURL=p-DKhaR-Ti.js.map

//# sourceMappingURL=p-DKhaR-Ti.js.map