import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotBasicOrder = /*@__PURE__*/ proxyCustomElement(class SlotBasicOrder extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("slot", { key: 'e3bf9b828441feb6980b8f16a8ef83de2e495583' });
    }
}, [260, "slot-basic-order"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-basic-order"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-basic-order":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotBasicOrder);
            }
            break;
    } });
}

export { SlotBasicOrder as S, defineCustomElement as d };
