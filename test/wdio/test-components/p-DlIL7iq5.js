import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { E as ExtendedCmpCmp } from './p-CmsH4G4X.js';

const ExtendedCmp = /*@__PURE__*/ proxyCustomElement(class ExtendedCmp extends ExtendedCmpCmp {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '8da6ff4f2abaf14a9ea8ef2be963766dfcc12d75' }, h("p", { key: '41cb31cc4518a6ffb73456741a0e30746940147c', class: "extended-prop-1" }, "Extended class prop 1: ", this.prop1), h("p", { key: '2887661c5b3d97f64da82b4524a80df48b93115a', class: "extended-prop-2" }, "Extended class prop 2: ", this.prop2), h("p", { key: '8eb95065365efa418921ce20a1a3f629bb968fba', class: "extended-state-1" }, "Extended class state 1: ", this.state1), h("p", { key: '76a86b0ed69dd21222bc84eeec5049ce84fa6743', class: "extended-state-2" }, "Extended class state 2: ", this.state2)));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExtendedCmp);
            }
            break;
    } });
}

export { ExtendedCmp as E, defineCustomElement as d };
