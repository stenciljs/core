import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotNone$1 = /*@__PURE__*/ proxyCustomElement(class SlotNone extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h(Host, { key: '1ec6bf97d846bd16a923a6953648f796c0a22535', role: "list" });
    }
}, [0, "slot-none"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-none"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-none":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNone$1);
            }
            break;
    } });
}

const SlotNone = SlotNone$1;
const defineCustomElement = defineCustomElement$1;

export { SlotNone, defineCustomElement };
