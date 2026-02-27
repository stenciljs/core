import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { S as SiblingExtendedBase } from './p-CPDJGvEg.js';

const SiblingExtended = /*@__PURE__*/ proxyCustomElement(class SiblingExtended extends SiblingExtendedBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '43a4861c985a77b90b07a8e577dadfb95147cfad' }, h("p", { key: '292c6f34f98eb2e76d08df30efe07ed0d2dc869d', class: "extended-prop-1" }, "Extended class prop 1: ", this.prop1), h("p", { key: 'a4af5a0ec6969b0b7d214f84d20db1d7a520fc9b', class: "extended-prop-2" }, "Extended class prop 2: ", this.prop2), h("p", { key: '13d6b61540cb168fec7e282fc4d21054ceb22eb5', class: "extended-state-1" }, "Extended class state 1: ", this.state1), h("p", { key: 'e3319cb2c569cb433b26e0e638d229ff07d16077', class: "extended-state-2" }, "Extended class state 2: ", this.state2)));
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
}, [512, "sibling-extended", {
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
    const components = ["sibling-extended"];
    components.forEach(tagName => { switch (tagName) {
        case "sibling-extended":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SiblingExtended);
            }
            break;
    } });
}

export { SiblingExtended as S, defineCustomElement as d };
