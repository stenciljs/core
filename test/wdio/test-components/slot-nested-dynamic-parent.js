import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-wK-4G8Jc.js';
import { d as defineCustomElement$2 } from './p-C3KP0tP6.js';

const SlotNestedDynamicParent$1 = /*@__PURE__*/ proxyCustomElement(class SlotNestedDynamicParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '39f593ca126657f67d1d36458c776c5f5f3c9315' }, h("slot-nested-dynamic-child", { key: 'f490d1c802d8efa0824262149a76f5be7eea5bf5' }, h("span", { key: 'cf5540a2580ffbad93e0b55dc9fb075057ecddcf', slot: "header" }, "Header Text"), h("slot", { key: '6807b38f8d939a9d69738e8324a3ff4365afe222' }))));
    }
}, [262, "slot-nested-dynamic-parent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-dynamic-parent", "slot-nested-dynamic-child", "slot-nested-dynamic-wrapper"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-dynamic-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedDynamicParent$1);
            }
            break;
        case "slot-nested-dynamic-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "slot-nested-dynamic-wrapper":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const SlotNestedDynamicParent = SlotNestedDynamicParent$1;
const defineCustomElement = defineCustomElement$1;

export { SlotNestedDynamicParent, defineCustomElement };
