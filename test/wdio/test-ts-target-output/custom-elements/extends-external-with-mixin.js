import { t as transformTag, p as proxyCustomElement, h } from './index.js';
import { S as SiblingWithMixin } from './p-Pmlfzd6n.js';

const ExtendsExternalWithMixin$1 = /*@__PURE__*/ proxyCustomElement(class ExtendsExternalWithMixin extends SiblingWithMixin {
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
        return (h("div", { key: 'fbdf7010d002485c96dc643d2ac01a7cdb62e6f6' }, h("p", { key: 'd1c175f7964a5f156a0d20c2f3d3a2734d1b8703', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: '9cb4670c0e9e42ed0602ce7522af678e02bbf616', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: '96825bc07b67e183857cf8ac19b2801b2ea11785', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'ee4a13fe6295645ce54360516c323504d5e2caf7', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: '9f05cbcfcb1fcd5e33fefcc4006efc7783a51756', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
}, [512, "extends-external-with-mixin", {
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
    const components = ["extends-external-with-mixin"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-external-with-mixin":
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), ExtendsExternalWithMixin$1);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsExternalWithMixin = ExtendsExternalWithMixin$1;
const defineCustomElement = defineCustomElement$1;

export { ExtendsExternalWithMixin, defineCustomElement };
//# sourceMappingURL=extends-external-with-mixin.js.map

//# sourceMappingURL=extends-external-with-mixin.js.map