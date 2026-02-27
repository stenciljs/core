import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-BSZ6URFD.js';

const ScopedSlotChangeWrap = /*@__PURE__*/ proxyCustomElement(class ScopedSlotChangeWrap extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.swapSlotContent = false;
    }
    render() {
        return (h("div", { key: '64b28c634b22b625e311df56198f18a930342fd1' }, h("scoped-slot-slotchange", { key: 'a139ae46c4bceb9b55fac101521ecbd85cd2250c' }, this.swapSlotContent ? h("div", null, "Swapped slotted content") : h("p", null, "Initial slotted content"))));
    }
}, [2, "scoped-slot-slotchange-wrap", {
        "swapSlotContent": [4, "swap-slot-content"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-slotchange-wrap", "scoped-slot-slotchange"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-slotchange-wrap":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotChangeWrap);
            }
            break;
        case "scoped-slot-slotchange":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ScopedSlotSlotchangeWrap = ScopedSlotChangeWrap;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotSlotchangeWrap, defineCustomElement };
