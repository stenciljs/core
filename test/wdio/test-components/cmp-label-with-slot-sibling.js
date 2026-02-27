import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const CmpLabelWithSlotSibling$1 = /*@__PURE__*/ proxyCustomElement(class CmpLabelWithSlotSibling extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '693af01d1fbad1968ff44d07f6c1bf1ceb4955b6' }, h("label", { key: '70e0abdf71bd06e67814dcd9a55d53087386721c' }, h("slot", { key: '58347ceca65307ce7fe650fbbb8b5d7bd42ecfa3' }), h("div", { key: '0d9c9f97907778f277fa6837b40d89edf2f82053' }, "Non-slotted text"))));
    }
}, [262, "cmp-label-with-slot-sibling"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-label-with-slot-sibling"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-label-with-slot-sibling":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpLabelWithSlotSibling$1);
            }
            break;
    } });
}

const CmpLabelWithSlotSibling = CmpLabelWithSlotSibling$1;
const defineCustomElement = defineCustomElement$1;

export { CmpLabelWithSlotSibling, defineCustomElement };
