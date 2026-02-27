import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotDynamicNameChangeScoped$1 = /*@__PURE__*/ proxyCustomElement(class SlotDynamicNameChangeScoped extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.slotName = 'greeting';
    }
    render() {
        return (h("div", { key: '99abe362817f35d1709958321a8844961a674324' }, h("slot", { key: 'fade0511cdfa1a61f4ad152adcce65a2be083ce9', name: this.slotName })));
    }
}, [262, "slot-dynamic-name-change-scoped", {
        "slotName": [1, "slot-name"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-dynamic-name-change-scoped"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-dynamic-name-change-scoped":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotDynamicNameChangeScoped$1);
            }
            break;
    } });
}

const SlotDynamicNameChangeScoped = SlotDynamicNameChangeScoped$1;
const defineCustomElement = defineCustomElement$1;

export { SlotDynamicNameChangeScoped, defineCustomElement };
