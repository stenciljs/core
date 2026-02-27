import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-DMDLAq1x.js';

const StencilSibling$1 = /*@__PURE__*/ proxyCustomElement(class StencilSibling extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'd175073498e3bb82ce57b45f43d111a992039614' }, h("sibling-root", { key: 'c948b3a63ec55a8185e1a127766bd99d905b5827' }, "sibling-light-dom")));
    }
}, [0, "stencil-sibling"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["stencil-sibling", "sibling-root"];
    components.forEach(tagName => { switch (tagName) {
        case "stencil-sibling":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), StencilSibling$1);
            }
            break;
        case "sibling-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const StencilSibling = StencilSibling$1;
const defineCustomElement = defineCustomElement$1;

export { StencilSibling, defineCustomElement };
