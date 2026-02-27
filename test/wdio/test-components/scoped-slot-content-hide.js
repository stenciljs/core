import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotContentHide$1 = /*@__PURE__*/ proxyCustomElement(class ScopedSlotContentHide extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.useSlot = false;
    }
    render() {
        return (h(Host, { key: '7a19eada29627611bcc504bf59f33f70ca434067' }, h("p", { key: 'bde6772466c4bf9a6b675dc0ca2d0baf4b95ea96' }, "Test Component"), this.useSlot && h("slot", { key: '245a0931eed90d7f49af14c1ae81256ce4fbffda' })));
    }
}, [262, "scoped-slot-content-hide", {
        "useSlot": [1028, "use-slot"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-content-hide"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-content-hide":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotContentHide$1);
            }
            break;
    } });
}

const ScopedSlotContentHide = ScopedSlotContentHide$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotContentHide, defineCustomElement };
