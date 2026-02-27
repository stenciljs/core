import { p as proxyCustomElement, h, t as transformTag } from './p-DYdAJnXF.js';
import { S as SiblingWithMixin } from './p-B_opr3WM.js';

const ExtendsExternalWithMixin$1 = /*@__PURE__*/ proxyCustomElement(class ExtendsExternalWithMixin extends SiblingWithMixin {
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
        return (h("div", { key: 'daf184c913ae511b6c8791ab46178580b956d736' }, h("p", { key: 'ff85c1883e4c71360384df4929738efed5613d8d', class: "main-prop-1" }, "Main class prop1: ", this.prop1), h("p", { key: 'd9d315269e59805728dab4ee56cfda7ed5855d2e', class: "main-prop-2" }, "Main class prop2: ", this.prop2), h("p", { key: 'eb1beeaa93d2af77b0a425f0db33e86a4f041bb0', class: "main-getter-prop" }, "Main class getterProp: ", this.getterProp), h("p", { key: 'b5e79ba7954ef62aecddaf9eda81336819f528b7', class: "main-state-1" }, "Main class state1: ", this.state1), h("p", { key: 'bd068f1b231fbcfc5a477f0f006186d3c12a8913', class: "main-state-2" }, "Main class state2: ", this.state2)));
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
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ExtendsExternalWithMixin$1);
            }
            break;
    } });
}

const ExtendsExternalWithMixin = ExtendsExternalWithMixin$1;
const defineCustomElement = defineCustomElement$1;

export { ExtendsExternalWithMixin, defineCustomElement };
