import { t as transformTag, p as proxyCustomElement, h } from './index.js';
import { E as ExtendedCmp } from './p-DKhaR-Ti.js';

const ExtendsCmpCmp$1 = /*@__PURE__*/ proxyCustomElement(class ExtendsCmpCmp extends ExtendedCmp {
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
        return (h("div", { key: 'f95321b1653fbb6fd5823869f7f8846aac36d46f' }, h("p", { key: '1bf0d0a3aeb166a6e7bf209785cba63f336a12a1', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: 'bacc48975af92d79a840d20de957a9836641d549', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '6d25a8850d5da8ac201074a0b61d3daf15c405c0', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: '1a63d2ba06552ae4400e7263c95a409019f48184', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: 'bb1360e7d7ff32a57f8d88a7df41048d79a89886', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
}, [512, "extends-cmp-cmp", {
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
    const components = ["extends-cmp-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-cmp-cmp":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ExtendsCmpCmp$1);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsCmpCmp = ExtendsCmpCmp$1;
const defineCustomElement = defineCustomElement$1;

export { ExtendsCmpCmp, defineCustomElement };
//# sourceMappingURL=extends-cmp-cmp.js.map

//# sourceMappingURL=extends-cmp-cmp.js.map