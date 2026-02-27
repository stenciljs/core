import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotChildrenRoot$1 = /*@__PURE__*/ proxyCustomElement(class SlotChildrenRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("section", { key: '0628311028a48dca03b804f4eb0f29d05626f077' }, "ShadowRoot1", h("article", { key: '6f98b058687797c9608e5d3eb0a64e715c378dc4' }, h("slot", { key: '93fcd33a3bbe72dae07f9618f3c899d857195eba' })), "ShadowRoot2"));
    }
}, [257, "slot-children-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-children-root"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-children-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotChildrenRoot$1);
            }
            break;
    } });
}

const SlotChildrenRoot = SlotChildrenRoot$1;
const defineCustomElement = defineCustomElement$1;

export { SlotChildrenRoot, defineCustomElement };
