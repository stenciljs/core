import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-Cq7IvkXD.js';

const ShadowDomBasicRoot$1 = /*@__PURE__*/ proxyCustomElement(class ShadowDomBasicRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("shadow-dom-basic", { key: '77df4ad36c22ce72a295d8c21fa82f72c77931c8' }, h("div", { key: '31f0387918fdabe63c50548b75fb643ce931d467' }, "light")));
    }
    static get style() { return `div {
      background: rgb(255, 255, 0);
    }`; }
}, [1, "shadow-dom-basic-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-basic-root", "shadow-dom-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-basic-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomBasicRoot$1);
            }
            break;
        case "shadow-dom-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ShadowDomBasicRoot = ShadowDomBasicRoot$1;
const defineCustomElement = defineCustomElement$1;

export { ShadowDomBasicRoot, defineCustomElement };
