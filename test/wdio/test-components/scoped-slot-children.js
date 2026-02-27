import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const ScopedSlotChildren$1 = /*@__PURE__*/ proxyCustomElement(class ScopedSlotChildren extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '9a035c2fdd63d25cb7afe0c979f2b4d14160ab4f' }, h("p", { key: 'c567edcdf2f0b5f1613a14310908d849a5f6f69c' }, "internal text 1"), h("slot", { key: '6181fe38d19ae0559e8f5ef588fb64415a21fec4', name: "second-slot" }), h("div", { key: 'b97270d53b920bc7d62df37b1b874b24fe236737' }, h("slot", { key: '9f995dcca6cbfbc79a59b18b5e29fac158ba8825' }, "This is fallback text")), h("p", { key: '44f0446c957450746b1a14da7558263af4b581a8' }, "internal text 2")));
    }
}, [262, "scoped-slot-children"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-slot-children"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-slot-children":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedSlotChildren$1);
            }
            break;
    } });
}

const ScopedSlotChildren = ScopedSlotChildren$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedSlotChildren, defineCustomElement };
