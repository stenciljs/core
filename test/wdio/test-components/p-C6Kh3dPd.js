import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotMapOrder = /*@__PURE__*/ proxyCustomElement(class SlotMapOrder extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("slot", { key: '349f458897feee93f6021ed21a0dad8d6fc27123' });
    }
}, [260, "slot-map-order"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-map-order"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-map-order":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotMapOrder);
            }
            break;
    } });
}

export { SlotMapOrder as S, defineCustomElement as d };
