import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-LR7oE-vZ.js';

const SlotNestedDefaultOrderParent$1 = /*@__PURE__*/ proxyCustomElement(class SlotNestedDefaultOrderParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '4cc13d78bcbd9103fcb9abd1836918d2ade118a0' }, h("div", { key: 'f7bcef06d4d21129a59f7e7a3d5633bef2e94913' }, h("slot-nested-default-order-child", { key: '69f05f85b3364fa1716586c840390db48b98951c', state: true }, h("slot", { key: '86db00f991b8d5d630b2ae775b8c9c68c17262f7' })))));
    }
}, [260, "slot-nested-default-order-parent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-default-order-parent", "slot-nested-default-order-child"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-default-order-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedDefaultOrderParent$1);
            }
            break;
        case "slot-nested-default-order-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotNestedDefaultOrderParent = SlotNestedDefaultOrderParent$1;
const defineCustomElement = defineCustomElement$1;

export { SlotNestedDefaultOrderParent, defineCustomElement };
