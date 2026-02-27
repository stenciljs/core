import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedConditional$1 = /*@__PURE__*/ proxyCustomElement(class ScopedConditional extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.renderHello = false;
    }
    render() {
        return (h("div", { key: '352d54c0d3ddf0fdae60f6b97c0c4177daf41304' }, this.renderHello && h("div", { key: '70243347c02993888716a5bc35c18e0db977800c', class: "tag", innerHTML: 'Hello' }), h("div", { key: '5863e58e9b9ae2088160375fbec7afd5a5bb944c' }, "before slot->", h("slot", { key: '33db70eb3c74413cd2a8605491e25690d64acc8f' }), "<-after slot")));
    }
}, [262, "scoped-conditional", {
        "renderHello": [4, "render-hello"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-conditional"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-conditional":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedConditional$1);
            }
            break;
    } });
}

const ScopedConditional = ScopedConditional$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedConditional, defineCustomElement };
