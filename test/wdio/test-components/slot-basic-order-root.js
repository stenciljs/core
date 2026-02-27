import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-DjSexh3o.js';

const SlotBasicOrderRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotBasicOrderRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("slot-basic-order", { key: 'eb85aafadfe7a55e8caf961ec36c40d33ad63c9f' }, h("content-a", { key: '1bfe943077d7f8eb7f98a021d9b6e70bc76b5f32' }, "a"), h("content-b", { key: 'c3d9c3e5d0295615917a07cf16d3762ec671c5af' }, "b"), h("content-c", { key: '832b6cc1101911210e9e1eb564a260c623a35467' }, "c")));
    }
}, [0, "slot-basic-order-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-basic-order-root", "slot-basic-order"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-basic-order-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotBasicOrderRoot$1);
            }
            break;
        case "slot-basic-order":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotBasicOrderRoot = SlotBasicOrderRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotBasicOrderRoot, defineCustomElement };
