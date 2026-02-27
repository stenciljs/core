import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-C6Kh3dPd.js';

const SlotMapOrderRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotMapOrderRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        const items = ['a', 'b', 'c'];
        return (h("slot-map-order", { key: '4d449f89055a5acd6ba8d41b6b361c6839754846' }, items.map((item) => (h("div", null, h("input", { type: "text", value: item }))))));
    }
}, [0, "slot-map-order-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-map-order-root", "slot-map-order"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-map-order-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotMapOrderRoot$1);
            }
            break;
        case "slot-map-order":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotMapOrderRoot = SlotMapOrderRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotMapOrderRoot, defineCustomElement };
