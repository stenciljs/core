import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotHideContentOpen$1 = /*@__PURE__*/ proxyCustomElement(class SlotHideContentOpen extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.enabled = false;
    }
    render() {
        return (h(Host, { key: 'b1c2c59a9a3347fc0037b0ab197474614688e353' }, h("p", { key: '81be671ad6d3178244e98d11fe625b1c1b76ff19' }, "Test"), this.enabled && (h("div", { key: '1dbd4eca1a78c658eefd550d53fc0af3a575ec83', class: "slot-wrapper" }, h("slot", { key: '5a70bf444ef6d9eb3e2ca91c762f052fa8055901' }, h("span", { key: 'a61e2875c66dd18e4ca78637fd62d36c6d094880' }, "fallback default slot"))))));
    }
}, [260, "slot-hide-content-open", {
        "enabled": [4]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-hide-content-open"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-hide-content-open":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotHideContentOpen$1);
            }
            break;
    } });
}

const SlotHideContentOpen = SlotHideContentOpen$1;
const defineCustomElement = defineCustomElement$1;

export { SlotHideContentOpen, defineCustomElement };
