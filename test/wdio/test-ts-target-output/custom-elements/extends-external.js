import { t as transformTag, p as proxyCustomElement, h } from './index.js';
import { S as SiblingExtended } from './p-llKHryS9.js';

const ExtendsCmpCmp = /*@__PURE__*/ proxyCustomElement(class ExtendsCmpCmp extends SiblingExtended {
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
        return (h("div", { key: 'c3ef3353ce5f8e48c8b4f91948e5196d7d7dedc8' }, h("p", { key: 'd33fb666a5a6a94ba234498590bcd8af476cec8f', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: 'ea1201e75b215680fbdc3885d0c96cc899769458', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '74ca005cd22e418db357e9068deb33f536d238e8', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'a7c3756e1852efda9c5d12dcfc662ec7b2ab9cd7', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '37c52c4c2cfd46ab6fd98690cdf0a8b7c50aec3b', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
}, [512, "extends-external", {
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
    const components = ["extends-external"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-external":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ExtendsCmpCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsExternal = ExtendsCmpCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsExternal, defineCustomElement };
//# sourceMappingURL=extends-external.js.map

//# sourceMappingURL=extends-external.js.map