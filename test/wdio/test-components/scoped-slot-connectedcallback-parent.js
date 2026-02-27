import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-BoLaioIj.js';
import { d as defineCustomElement$2 } from './p-rYl__QAV.js';

const ScopedSlotConnectedCallbackParent = /*@__PURE__*/ proxyCustomElement(class ScopedSlotConnectedCallbackParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("scoped-slot-connectedcallback-middle", { key: '0d6dfa36a0e8e5921feb0b8d61e1992a97e59279' });
    }
}, [0, "scoped-slot-connectedcallback-parent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-connectedcallback-parent", "scoped-slot-connectedcallback-child", "scoped-slot-connectedcallback-middle"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-connectedcallback-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotConnectedCallbackParent);
            }
            break;
        case "scoped-slot-connectedcallback-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "scoped-slot-connectedcallback-middle":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ScopedSlotConnectedcallbackParent = ScopedSlotConnectedCallbackParent;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotConnectedcallbackParent, defineCustomElement };
