import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ShadowDomArray = /*@__PURE__*/ proxyCustomElement(class ShadowDomArray extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.values = [];
    }
    render() {
        return this.values.map((v) => h("div", null, v));
    }
}, [1, "shadow-dom-array", {
        "values": [16]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-array"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-array":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomArray);
            }
            break;
    } });
}

export { ShadowDomArray as S, defineCustomElement as d };
