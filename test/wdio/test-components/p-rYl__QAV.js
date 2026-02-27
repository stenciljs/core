import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-BoLaioIj.js';

const ScopedSlotConnectedCallbackMiddle = /*@__PURE__*/ proxyCustomElement(class ScopedSlotConnectedCallbackMiddle extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("scoped-slot-connectedcallback-child", { key: 'de45cf71d93fd6b52cd9c68287c86eac70b9e601' }, h("span", { key: 'b017f1213c24f41b2b1cc35f6e699359e77bac9b', id: "slotted-content" }, "Slotted Content")));
    }
}, [0, "scoped-slot-connectedcallback-middle"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-connectedcallback-middle", "scoped-slot-connectedcallback-child"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-connectedcallback-middle":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotConnectedCallbackMiddle);
            }
            break;
        case "scoped-slot-connectedcallback-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { ScopedSlotConnectedCallbackMiddle as S, defineCustomElement as d };
