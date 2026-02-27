import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotDynamicNameChangeShadow$1 = /*@__PURE__*/ proxyCustomElement(class SlotDynamicNameChangeShadow extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.slotName = 'greeting';
    }
    render() {
        return (h("div", { key: '29e1b1eb0cc3a7fad29ac3064f81b669cde62aa1' }, h("slot", { key: '7876fefd7fd949aabf6d8b57282fe5290e325691', name: this.slotName })));
    }
}, [257, "slot-dynamic-name-change-shadow", {
        "slotName": [1, "slot-name"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-dynamic-name-change-shadow"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-dynamic-name-change-shadow":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotDynamicNameChangeShadow$1);
            }
            break;
    } });
}

const SlotDynamicNameChangeShadow = SlotDynamicNameChangeShadow$1;
const defineCustomElement = defineCustomElement$1;

export { SlotDynamicNameChangeShadow, defineCustomElement };
