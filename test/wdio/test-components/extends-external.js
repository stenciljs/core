import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { S as SiblingExtended } from './p-CFaSFp72.js';

const ExtendsCmpCmp = /*@__PURE__*/ proxyCustomElement(class ExtendsCmpCmp extends SiblingExtended {
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
        return (h("div", { key: 'cdac190b005eeb57bf06f6650c8f44f9277d88bf' }, h("p", { key: '3c052a06162f0151acada1e3673a12073e52a8d8', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '364d754a0884af6a6d357c560f0c7dd587a8eb93', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: 'cd63278b4b4b8469959e822ab4b690752733140c', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: '7c7ac843e78e4687d726005e33a8b83cb9a3b652', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '14304408b36559d6893268c5e6bff79344715ed8', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExtendsCmpCmp);
            }
            break;
    } });
}

const ExtendsExternal = ExtendsCmpCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsExternal, defineCustomElement };
