import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-tGV2tZ7a.js';

const SlotNestedOrderParent$1 = /*@__PURE__*/ proxyCustomElement(class SlotNestedOrderParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '8e52248a87d0ad25cf53d5346507051d14295c2c' }, h("slot", { key: '0169088dd8805fe593a47da9416b8166990d12d0' }), h("slot-nested-order-child", { key: '841f6e253323f6ce2f69bd05fd4407e94fc0c5d6' }, h("slot", { key: '866d1bbe3f3d4d2eb55014c060c8b0b483994ead', name: "italic-slot-name" }), h("cmp-6", { key: 'e5eff2009958c8d305c1c6bdab2a672852a8d3a3', slot: "end-slot-name" }, "6"))));
    }
}, [260, "slot-nested-order-parent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-order-parent", "slot-nested-order-child"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-order-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedOrderParent$1);
            }
            break;
        case "slot-nested-order-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotNestedOrderParent = SlotNestedOrderParent$1;
const defineCustomElement = defineCustomElement$1;

export { SlotNestedOrderParent, defineCustomElement };
