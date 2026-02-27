import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpClientScopedCss = () => `.sc-cmp-client-scoped-h{display:block;border:10px solid yellow;margin:10px;padding:10px}.client-scoped.sc-cmp-client-scoped{color:rgb(255, 0, 0);font-weight:bold}`;

const CmpClientScoped$1 = /*@__PURE__*/ proxyCustomElement(class CmpClientScoped extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("section", { key: '22d62555c57950f0396615148b4f164df5dfeb44', class: "client-scoped" }, h("slot", { key: 'f9b35dc81b35ecafc3548cb55fa19dc6d5847123' })));
    }
    static get style() { return cmpClientScopedCss(); }
}, [262, "cmp-client-scoped"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-client-scoped"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-client-scoped":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpClientScoped$1);
            }
            break;
    } });
}

const CmpClientScoped = CmpClientScoped$1;
const defineCustomElement = defineCustomElement$1;

export { CmpClientScoped, defineCustomElement };
