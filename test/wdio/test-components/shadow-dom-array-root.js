import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-5sqCnar5.js';

const ShadowDomArrayRoot$1 = /*@__PURE__*/ proxyCustomElement(class ShadowDomArrayRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.values = [0];
    }
    addValue() {
        this.values = [...this.values, this.values.length];
    }
    render() {
        return (h("div", { key: '9587400ed2a3e2c42059675a187e36108484a5ef' }, h("button", { key: 'f0665615da70a1f2b23a4296d025cbe7a020ca1d', onClick: this.addValue.bind(this) }, "Add Value"), h("shadow-dom-array", { key: 'a2fdd284f5ef5fc36f6a1d4901282b449555d3a2', values: this.values, class: "results1" })));
    }
}, [0, "shadow-dom-array-root", {
        "values": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-array-root", "shadow-dom-array"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-array-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomArrayRoot$1);
            }
            break;
        case "shadow-dom-array":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ShadowDomArrayRoot = ShadowDomArrayRoot$1;
const defineCustomElement = defineCustomElement$1;

export { ShadowDomArrayRoot, defineCustomElement };
