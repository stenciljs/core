import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-ejTWVSda.js';
import { d as defineCustomElement$2 } from './p-g78tSsa3.js';

const cmpClientShadowCss = () => `:host{display:block;border:10px solid purple;margin:10px;padding:10px}.client-shadow{color:rgb(0, 155, 0);font-weight:bold}`;

const CmpClientShadow$1 = /*@__PURE__*/ proxyCustomElement(class CmpClientShadow extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("article", { key: 'f425bac42dd7569de25ae8717ed4bcf85b8f960c', class: "client-shadow" }, h("slot", { key: 'f255f862049c34574e9baae18d3aa4ac4e5fbff5' }), h("cmp-text-blue", { key: '3870c2ff0fab0b8899e1ee6fdda80867ac78a9f9' }), h("cmp-text-green", { key: '0aec9f089253d883376c3a37968ada6cb0a3c7f6' })));
    }
    static get style() { return cmpClientShadowCss(); }
}, [257, "cmp-client-shadow"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-client-shadow", "cmp-text-blue", "cmp-text-green"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-client-shadow":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpClientShadow$1);
            }
            break;
        case "cmp-text-blue":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "cmp-text-green":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CmpClientShadow = CmpClientShadow$1;
const defineCustomElement = defineCustomElement$1;

export { CmpClientShadow, defineCustomElement };
